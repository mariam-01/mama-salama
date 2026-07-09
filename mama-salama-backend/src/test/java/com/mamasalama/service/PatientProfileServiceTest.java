package com.mamasalama.service;

import com.mamasalama.dto.request.PatientProfileRequest;
import com.mamasalama.entity.PatientProfile;
import com.mamasalama.entity.User;
import com.mamasalama.enums.BloodType;
import com.mamasalama.enums.FollowUpType;
import com.mamasalama.enums.Role;
import com.mamasalama.exception.ResourceNotFoundException;
import com.mamasalama.repository.PatientProfileRepository;
import com.mamasalama.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PatientProfileService")
class PatientProfileServiceTest {

    @Mock private PatientProfileRepository profileRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private PatientProfileService patientProfileService;

    private User user;
    private static final String EMAIL = "fatima@test.ma";

    @BeforeEach
    void setUp() {
        user = User.builder()
                .email(EMAIL)
                .password("hashed")
                .role(Role.PATIENT)
                .enabled(true)
                .build();
    }

    // -------------------------------------------------------------- getProfile
    @Nested
    @DisplayName("getProfile")
    class GetProfile {

        @Test
        @DisplayName("existing profile → returns it")
        void existingProfile_returnsIt() {
            PatientProfile existing = PatientProfile.builder()
                    .user(user)
                    .fullName("Fatima Zahra")
                    .build();
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(profileRepository.findByUser(user)).thenReturn(Optional.of(existing));

            var result = patientProfileService.getProfile(EMAIL);

            assertThat(result).isNotNull();
            verify(profileRepository, never()).save(any());
        }

        @Test
        @DisplayName("no profile → creates and saves an empty one")
        void noProfile_createsEmpty() {
            PatientProfile empty = PatientProfile.builder().user(user).build();
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(profileRepository.findByUser(user)).thenReturn(Optional.empty());
            when(profileRepository.save(any(PatientProfile.class))).thenReturn(empty);

            patientProfileService.getProfile(EMAIL);

            verify(profileRepository).save(any(PatientProfile.class));
        }

        @Test
        @DisplayName("unknown email → throws ResourceNotFoundException")
        void unknownEmail_throwsException() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> patientProfileService.getProfile(EMAIL))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ---------------------------------------------------------- createProfile
    @Nested
    @DisplayName("createProfile")
    class CreateProfile {

        @Test
        @DisplayName("new profile → saves with all fields applied")
        void newProfile_savesAllFields() {
            PatientProfileRequest req = fullRequest();
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(profileRepository.findByUser(user)).thenReturn(Optional.empty());
            when(profileRepository.save(any(PatientProfile.class))).thenAnswer(inv -> inv.getArgument(0));

            patientProfileService.createProfile(req, EMAIL);

            ArgumentCaptor<PatientProfile> captor = ArgumentCaptor.forClass(PatientProfile.class);
            verify(profileRepository).save(captor.capture());
            PatientProfile saved = captor.getValue();
            assertThat(saved.getFullName()).isEqualTo("Fatima Zahra");
            assertThat(saved.getBloodType()).isEqualTo(BloodType.A_POSITIVE);
            assertThat(saved.getPregnancyWeek()).isEqualTo(20);
            assertThat(saved.getFollowUpType()).isEqualTo(FollowUpType.GYNECOLOGIST);
        }

        @Test
        @DisplayName("existing profile → updates it instead of creating new")
        void existingProfile_updates() {
            PatientProfile existing = PatientProfile.builder().user(user).build();
            PatientProfileRequest req = fullRequest();
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(profileRepository.findByUser(user)).thenReturn(Optional.of(existing));
            when(profileRepository.save(any(PatientProfile.class))).thenAnswer(inv -> inv.getArgument(0));

            patientProfileService.createProfile(req, EMAIL);

            // Should save the existing instance, not create a new one
            ArgumentCaptor<PatientProfile> captor = ArgumentCaptor.forClass(PatientProfile.class);
            verify(profileRepository).save(captor.capture());
            assertThat(captor.getValue()).isSameAs(existing);
        }
    }

    // ---------------------------------------------------------- updateProfile
    @Nested
    @DisplayName("updateProfile")
    class UpdateProfile {

        @Test
        @DisplayName("existing profile → updates and returns")
        void existingProfile_updatesAndReturns() {
            PatientProfile existing = PatientProfile.builder().user(user).build();
            PatientProfileRequest req = fullRequest();
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(profileRepository.findByUser(user)).thenReturn(Optional.of(existing));
            when(profileRepository.save(any(PatientProfile.class))).thenAnswer(inv -> inv.getArgument(0));

            patientProfileService.updateProfile(req, EMAIL);

            verify(profileRepository).save(existing);
        }

        @Test
        @DisplayName("no profile → throws ResourceNotFoundException")
        void noProfile_throwsException() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(profileRepository.findByUser(user)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> patientProfileService.updateProfile(fullRequest(), EMAIL))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Profile not found");
        }

        @Test
        @DisplayName("LMP provided → calculates dueDate via Naegele's rule (+280 days)")
        void lmpProvided_calculatesDueDate() {
            PatientProfile existing = PatientProfile.builder().user(user).build();
            LocalDate lmp = LocalDate.now().minusWeeks(10);
            PatientProfileRequest req = new PatientProfileRequest();
            req.setLastMenstrualPeriod(lmp);

            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(profileRepository.findByUser(user)).thenReturn(Optional.of(existing));
            when(profileRepository.save(any(PatientProfile.class))).thenAnswer(inv -> inv.getArgument(0));

            patientProfileService.updateProfile(req, EMAIL);

            ArgumentCaptor<PatientProfile> captor = ArgumentCaptor.forClass(PatientProfile.class);
            verify(profileRepository).save(captor.capture());
            PatientProfile saved = captor.getValue();
            assertThat(saved.getDueDate()).isEqualTo(lmp.plusDays(280));
            assertThat(saved.getPregnancyWeekCalculated()).isEqualTo(10);
        }

        @Test
        @DisplayName("pregnancyWeek provided → calculates dueDateFromWeek")
        void pregnancyWeekProvided_calculatesDueDateFromWeek() {
            PatientProfile existing = PatientProfile.builder().user(user).build();
            PatientProfileRequest req = new PatientProfileRequest();
            req.setPregnancyWeek(30);

            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(profileRepository.findByUser(user)).thenReturn(Optional.of(existing));
            when(profileRepository.save(any(PatientProfile.class))).thenAnswer(inv -> inv.getArgument(0));

            patientProfileService.updateProfile(req, EMAIL);

            ArgumentCaptor<PatientProfile> captor = ArgumentCaptor.forClass(PatientProfile.class);
            verify(profileRepository).save(captor.capture());
            PatientProfile saved = captor.getValue();
            assertThat(saved.getPregnancyWeek()).isEqualTo(30);
            // 40 - 30 = 10 weeks remaining from now
            LocalDate expectedDue = LocalDate.now().plusWeeks(10);
            assertThat(saved.getDueDateFromWeek()).isEqualTo(expectedDue);
        }

        @Test
        @DisplayName("null supplements in request → saved as empty set")
        void nullSupplements_savedAsEmptySet() {
            PatientProfile existing = PatientProfile.builder().user(user).build();
            PatientProfileRequest req = new PatientProfileRequest();
            req.setSupplements(null);

            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(profileRepository.findByUser(user)).thenReturn(Optional.of(existing));
            when(profileRepository.save(any(PatientProfile.class))).thenAnswer(inv -> inv.getArgument(0));

            patientProfileService.updateProfile(req, EMAIL);

            ArgumentCaptor<PatientProfile> captor = ArgumentCaptor.forClass(PatientProfile.class);
            verify(profileRepository).save(captor.capture());
            assertThat(captor.getValue().getSupplements()).isNotNull().isEmpty();
        }
    }

    private PatientProfileRequest fullRequest() {
        PatientProfileRequest req = new PatientProfileRequest();
        req.setFullName("Fatima Zahra");
        req.setAge(28);
        req.setBloodType(BloodType.A_POSITIVE);
        req.setWeight(65.0);
        req.setHeight(165.0);
        req.setPregnancyWeek(20);
        req.setFollowUpType(FollowUpType.GYNECOLOGIST);
        req.setSupplements(Set.of());
        return req;
    }
}