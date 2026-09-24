-- V2: Convert oasis_spots.type from ordinal (smallint) to name (varchar) mapping.
--
-- Hibernate previously mapped OasisType with no @Enumerated annotation, which
-- defaults to EnumType.ORDINAL: the column was persisted as smallint with a
-- CHECK (type >= 0 AND type <= 2) constraint. Reordering or inserting a value
-- in OasisType would silently reassign the meaning of every existing row.
--
-- OasisSpot.type now uses @Enumerated(EnumType.STRING). This migration converts
-- the column in place, translating every existing row from its ordinal to the
-- matching enum name (0 = WATER_FOUNTAIN, 1 = SHADE, 2 = AC_BUILDING, per the
-- declaration order in OasisType.java).
--
-- The resulting column type, length and CHECK constraint below were confirmed
-- by starting the application with @Enumerated(EnumType.STRING) against a
-- throwaway database (spring.flyway.enabled=false, JPA_DDL_AUTO=create) and
-- inspecting the schema Hibernate generated, so that this migration produces
-- exactly what ddl-auto=validate expects.

ALTER TABLE oasis_spots
    DROP CONSTRAINT oasis_spots_type_check;

ALTER TABLE oasis_spots
    ALTER COLUMN type TYPE character varying(255)
    USING (
        CASE type
            WHEN 0 THEN 'WATER_FOUNTAIN'
            WHEN 1 THEN 'SHADE'
            WHEN 2 THEN 'AC_BUILDING'
        END
    );

ALTER TABLE oasis_spots
    ALTER COLUMN type SET NOT NULL;

ALTER TABLE oasis_spots
    ADD CONSTRAINT oasis_spots_type_check
    CHECK (type::text = ANY (ARRAY['WATER_FOUNTAIN'::character varying, 'SHADE'::character varying, 'AC_BUILDING'::character varying]::text[]));
