package com.mamasalama.mapper;

import com.mamasalama.dto.response.EmergencyAlertResponse;
import com.mamasalama.entity.EmergencyAlert;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EmergencyAlertMapper {

    @Mapping(target = "patientId", source = "patient.id")
    @Mapping(target = "patientFullName", source = "patient.fullName")
    @Mapping(target = "patientEmail", source = "patient.user.email")
    @Mapping(target = "patientPregnancyWeek", source = "patient.pregnancyWeek")
    @Mapping(target = "claimedByEmail", source = "claimedBy.email")
    @Mapping(target = "matchedDoctorsCount", ignore = true)
    @Mapping(target = "patientRegion", source = "patientRegion")
    EmergencyAlertResponse toResponse(EmergencyAlert alert);
}