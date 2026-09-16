package com.mamasalama.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class KeycloakJwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private static final List<String> APP_ROLES = List.of("PATIENT", "DOCTOR", "ADMIN");

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = extractAuthorities(jwt);
        String email = jwt.getClaimAsString("email");
        // Use email as principal name so authentication.getName() returns email in all services
        String name = email != null ? email : jwt.getSubject();
        return new JwtAuthenticationToken(jwt, authorities, name);
    }

    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess != null) {
            List<String> roles = (List<String>) realmAccess.get("roles");
            if (roles != null) {
                List<GrantedAuthority> appAuthorities = roles.stream()
                        .filter(APP_ROLES::contains)
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                        .collect(Collectors.toList());
                if (!appAuthorities.isEmpty()) return appAuthorities;
            }
        }
        // Any authenticated user without an explicit ADMIN/DOCTOR role is a patient
        return List.of(new SimpleGrantedAuthority("ROLE_PATIENT"));
    }
}
