package com.mamasalama.mapper;

import com.mamasalama.dto.response.AppointmentResponse;
import com.mamasalama.dto.response.AppointmentSlotResponse;
import com.mamasalama.entity.Appointment;
import com.mamasalama.entity.AppointmentSlot;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AppointmentMapper {

    @Mapping(target = "patientId", source = "patient.id")
    @Mapping(target = "patientFullName", source = "patient.fullName")
    @Mapping(target = "patientEmail", source = "patient.user.email")
    @Mapping(target = "doctorId", source = "doctor.id")
    @Mapping(target = "doctorEmail", source = "doctor.email")
    @Mapping(target = "alertId", source = "alert.id")
    AppointmentResponse toResponse(Appointment appointment);

    AppointmentSlotResponse toSlotResponse(AppointmentSlot slot);
}