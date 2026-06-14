-- Snapshot del preco del servicio en cada turno (para reportes históricos).
-- 1) agregar columna nullable
ALTER TABLE "agendamentos" ADD COLUMN "valor" DECIMAL(10,2);

-- 2) backfill: copiar el preco actual del servicio a los turnos existentes
UPDATE "agendamentos" a
SET "valor" = s."preco"
FROM "servicos" s
WHERE a."servicoId" = s."id";

-- 3) ya sin nulos: forzar NOT NULL
ALTER TABLE "agendamentos" ALTER COLUMN "valor" SET NOT NULL;
