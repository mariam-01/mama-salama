package com.mamasalama.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Value("${springdoc.server-url:http://localhost:8080/api/core}")
    private String serverUrl;

    @Bean
    public OpenAPI mamasalamaOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .addServersItem(new Server().url(serverUrl).description("API Gateway"))
                .info(new Info()
                        .title("Mama Salama API — ماما سلامة")
                        .version("1.0.0")
                        .description("Prenatal care platform for Moroccan pregnant women. " +
                                "Supports Arabic, Darija, French, and Amazigh.")
                        .contact(new Contact()
                                .name("Mama Salama Team")
                                .email("support@mamasalama.ma")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                                .name(securitySchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}