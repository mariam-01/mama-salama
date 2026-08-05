package com.mamasalama.mapper;

import com.mamasalama.dto.response.InviteCodeResponse;
import com.mamasalama.entity.InviteCode;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface InviteCodeMapper {

    @Mapping(target = "createdByEmail", source = "createdBy.email")
    @Mapping(target = "usedByEmail", source = "usedBy.email")
    InviteCodeResponse toResponse(InviteCode inviteCode);

    List<InviteCodeResponse> toResponseList(List<InviteCode> inviteCodes);
}