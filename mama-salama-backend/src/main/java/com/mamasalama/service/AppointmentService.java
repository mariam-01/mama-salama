package com.mamasalama.service;

import com.mamasalama.dto.request.AppointmentRequest;
import com.mamasalama.dto.request.ConfirmSlotRequest;
import com.mamasalama.dto.response.AppointmentResponse;
import com.mamasalama.entity.Appointment;
import com.mamasalama.entity.AppointmentSlot;
import com.mamasalama.entity.EmergencyAlert;
import com.mamasalama.entity.PatientProfile;
import com.mamasalama.entity.User;
import com.mamasalama.enums.AppointmentStatus;
import com.mamasalama.mapper.AppointmentMapper;
import com.mamasalama.repository.AppointmentRepository;
import com.mamasalama.repository.AppointmentSlotRepository;
import com.mamasalama.repository.EmergencyAlertRepository;
import com.mamasalama.repository.PatientProfileRepository;
import com.mamasalama.repository.UserRepository;
import com.mamasalama.exception.ResourceNotFoundException;
import com.mamasalama.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentSlotRepository slotRepository;
    private final PatientProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final EmergencyAlertRepository alertRepository;
    private final AppointmentMapper appointmentMapper;
    private final EmailService emailService;

    @Transactional
    public AppointmentResponse proposeAppointment(AppointmentRequest request, String doctorEmail) {
        User doctor = userRepository.findByEmail(doctorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        PatientProfile patient = profileRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        EmergencyAlert alert = null;
        if (request.getAlertId() != null) {
            alert = alertRepository.findById(request.getAlertId())
                    .orElseThrow(() -> new ResourceNotFoundException("Emergency alert not found"));
        }

        if (request.getSlots() == null || request.getSlots().isEmpty() || request.getSlots().size() > 3) {
            throw new ValidationException("Please propose between 1 and 3 appointment slots");
        }

        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .alert(alert)
                .type(request.getType())
                .location(request.getLocation())
                .notes(request.getNotes())
                .build();

        List<AppointmentSlot> slots = request.getSlots().stream()
                .map(dt -> AppointmentSlot.builder()
                        .appointment(appointment)
                        .dateTime(dt)
                        .build())
                .collect(Collectors.toList());
        appointment.setSlots(slots);

        Appointment saved = appointmentRepository.save(appointment);

        try {
            emailService.sendAppointmentProposedNotification(patient.getUser().getEmail(), doctorEmail, request.getType().name());
        } catch (Exception e) {
            log.warn("Failed to send appointment proposed notification: {}", e.getMessage());
        }

        return appointmentMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getDoctorAppointments(String doctorEmail) {
        User doctor = userRepository.findByEmail(doctorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        return appointmentRepository.findByDoctor(doctor).stream()
                .map(appointmentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getPatientAppointments(String patientEmail) {
        User user = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        PatientProfile profile = profileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
        return appointmentRepository.findByPatient(profile).stream()
                .map(appointmentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AppointmentResponse confirmAppointment(UUID appointmentId, ConfirmSlotRequest request, String patientEmail) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (!appointment.getPatient().getUser().getEmail().equals(patientEmail)) {
            throw new ValidationException("You are not authorized to confirm this appointment");
        }
        if (appointment.getStatus() != AppointmentStatus.PROPOSED) {
            throw new ValidationException("Only PROPOSED appointments can be confirmed");
        }

        AppointmentSlot chosen = appointment.getSlots().stream()
                .filter(s -> s.getId().equals(request.getSlotId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found in this appointment"));

        appointment.getSlots().forEach(s -> s.setSelected(false));
        chosen.setSelected(true);
        appointment.setConfirmedSlot(chosen);
        appointment.setStatus(AppointmentStatus.CONFIRMED);

        Appointment saved = appointmentRepository.save(appointment);

        try {
            emailService.sendAppointmentConfirmedNotification(
                    appointment.getDoctor().getEmail(),
                    appointment.getPatient().getUser().getEmail(),
                    chosen.getDateTime().toString());
        } catch (Exception e) {
            log.warn("Failed to send appointment confirmed notification: {}", e.getMessage());
        }

        return appointmentMapper.toResponse(saved);
    }

    @Transactional
    public AppointmentResponse rejectAppointment(UUID appointmentId, String patientEmail) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (!appointment.getPatient().getUser().getEmail().equals(patientEmail)) {
            throw new ValidationException("You are not authorized to reject this appointment");
        }
        if (appointment.getStatus() != AppointmentStatus.PROPOSED) {
            throw new ValidationException("Only PROPOSED appointments can be rejected");
        }

        appointment.setStatus(AppointmentStatus.REJECTED);
        return appointmentMapper.toResponse(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentResponse completeAppointment(UUID appointmentId, String doctorEmail) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (!appointment.getDoctor().getEmail().equals(doctorEmail)) {
            throw new ValidationException("Only the assigned doctor can complete this appointment");
        }
        if (appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new ValidationException("Only CONFIRMED appointments can be completed");
        }

        appointment.setStatus(AppointmentStatus.COMPLETED);
        return appointmentMapper.toResponse(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentResponse cancelAppointment(UUID appointmentId, String requesterEmail) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        boolean isPatient = appointment.getPatient().getUser().getEmail().equals(requesterEmail);
        boolean isDoctor = appointment.getDoctor().getEmail().equals(requesterEmail);

        if (!isPatient && !isDoctor) {
            throw new ValidationException("You are not authorized to cancel this appointment");
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLETED || appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new ValidationException("Cannot cancel an appointment that is already " + appointment.getStatus());
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        Appointment saved = appointmentRepository.save(appointment);

        try {
            String notifyEmail = isPatient ? appointment.getDoctor().getEmail() : appointment.getPatient().getUser().getEmail();
            emailService.sendAppointmentCancelledNotification(notifyEmail, requesterEmail);
        } catch (Exception e) {
            log.warn("Failed to send appointment cancelled notification: {}", e.getMessage());
        }

        return appointmentMapper.toResponse(saved);
    }
}