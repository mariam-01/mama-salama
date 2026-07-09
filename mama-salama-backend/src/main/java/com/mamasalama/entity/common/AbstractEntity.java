package com.mamasalama.entity.common;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * The Class AbstractEntity.
 */
@Getter
@Setter
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@MappedSuperclass
//@TypeDef(name = "postgres-uuid", defaultForType = UUID.class, typeClass = PostgresUUIDType.class)
public abstract class AbstractEntity extends DateAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
}
