CREATE TYPE "MoveCategory" AS ENUM ('FAST', 'CHARGED', 'UNKNOWN');
CREATE TYPE "MoveAvailability" AS ENUM ('NORMAL', 'ELITE', 'LEGACY', 'EVENT');

CREATE TABLE "Pokemon" (
  "id" INTEGER NOT NULL,
  "slug" VARCHAR(120) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "generation" INTEGER,
  "generationName" VARCHAR(80),
  "familyId" INTEGER,
  "legendary" BOOLEAN NOT NULL DEFAULT false,
  "mythic" BOOLEAN NOT NULL DEFAULT false,
  "ultraBeast" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Pokemon_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PokemonForm" (
  "id" BIGSERIAL NOT NULL,
  "pokemonId" INTEGER NOT NULL,
  "formId" INTEGER NOT NULL,
  "slug" VARCHAR(180) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "proto" VARCHAR(180),
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isCostume" BOOLEAN NOT NULL DEFAULT false,
  "attack" INTEGER,
  "defense" INTEGER,
  "stamina" INTEGER,
  "height" DOUBLE PRECISION,
  "weight" DOUBLE PRECISION,
  "buddyDistance" DOUBLE PRECISION,
  "thirdMoveStardust" INTEGER,
  "thirdMoveCandy" INTEGER,
  "tradable" BOOLEAN,
  "transferable" BOOLEAN,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PokemonForm_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Type" (
  "id" INTEGER NOT NULL,
  "slug" VARCHAR(80) NOT NULL,
  "name" VARCHAR(80) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Type_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PokemonType" (
  "pokemonFormId" BIGINT NOT NULL,
  "typeId" INTEGER NOT NULL,
  "slot" INTEGER NOT NULL,
  CONSTRAINT "PokemonType_pkey" PRIMARY KEY ("pokemonFormId", "typeId")
);

CREATE TABLE "Move" (
  "id" INTEGER NOT NULL,
  "slug" VARCHAR(140) NOT NULL,
  "name" VARCHAR(140) NOT NULL,
  "proto" VARCHAR(180),
  "category" "MoveCategory" NOT NULL DEFAULT 'UNKNOWN',
  "typeId" INTEGER,
  "power" INTEGER,
  "energy" INTEGER,
  "durationMs" INTEGER,
  "pvpPower" INTEGER,
  "pvpEnergy" INTEGER,
  "pvpTurns" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Move_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PokemonMove" (
  "pokemonFormId" BIGINT NOT NULL,
  "moveId" INTEGER NOT NULL,
  "availability" "MoveAvailability" NOT NULL DEFAULT 'NORMAL',
  CONSTRAINT "PokemonMove_pkey" PRIMARY KEY ("pokemonFormId", "moveId", "availability")
);

CREATE TABLE "Evolution" (
  "id" BIGSERIAL NOT NULL,
  "fromFormId" BIGINT NOT NULL,
  "toFormId" BIGINT NOT NULL,
  "candyCost" INTEGER,
  "itemId" INTEGER,
  CONSTRAINT "Evolution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DatasetVersion" (
  "id" TEXT NOT NULL,
  "version" VARCHAR(80) NOT NULL,
  "source" VARCHAR(180) NOT NULL,
  "sourceHash" VARCHAR(64) NOT NULL,
  "pokemonCount" INTEGER NOT NULL,
  "formCount" INTEGER NOT NULL,
  "moveCount" INTEGER NOT NULL,
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "active" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "DatasetVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Pokemon_slug_key" ON "Pokemon"("slug");
CREATE INDEX "Pokemon_name_idx" ON "Pokemon"("name");
CREATE INDEX "Pokemon_generation_idx" ON "Pokemon"("generation");
CREATE UNIQUE INDEX "PokemonForm_slug_key" ON "PokemonForm"("slug");
CREATE UNIQUE INDEX "PokemonForm_pokemonId_formId_key" ON "PokemonForm"("pokemonId", "formId");
CREATE INDEX "PokemonForm_pokemonId_idx" ON "PokemonForm"("pokemonId");
CREATE INDEX "PokemonForm_attack_idx" ON "PokemonForm"("attack");
CREATE UNIQUE INDEX "Type_slug_key" ON "Type"("slug");
CREATE INDEX "PokemonType_typeId_idx" ON "PokemonType"("typeId");
CREATE UNIQUE INDEX "Move_slug_key" ON "Move"("slug");
CREATE INDEX "Move_name_idx" ON "Move"("name");
CREATE INDEX "Move_typeId_idx" ON "Move"("typeId");
CREATE INDEX "Move_category_idx" ON "Move"("category");
CREATE INDEX "PokemonMove_moveId_idx" ON "PokemonMove"("moveId");
CREATE UNIQUE INDEX "Evolution_fromFormId_toFormId_key" ON "Evolution"("fromFormId", "toFormId");
CREATE INDEX "Evolution_toFormId_idx" ON "Evolution"("toFormId");
CREATE UNIQUE INDEX "DatasetVersion_version_key" ON "DatasetVersion"("version");
CREATE INDEX "DatasetVersion_active_importedAt_idx" ON "DatasetVersion"("active", "importedAt");

ALTER TABLE "PokemonForm" ADD CONSTRAINT "PokemonForm_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PokemonType" ADD CONSTRAINT "PokemonType_pokemonFormId_fkey" FOREIGN KEY ("pokemonFormId") REFERENCES "PokemonForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PokemonType" ADD CONSTRAINT "PokemonType_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "Type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Move" ADD CONSTRAINT "Move_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "Type"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PokemonMove" ADD CONSTRAINT "PokemonMove_pokemonFormId_fkey" FOREIGN KEY ("pokemonFormId") REFERENCES "PokemonForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PokemonMove" ADD CONSTRAINT "PokemonMove_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "Move"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Evolution" ADD CONSTRAINT "Evolution_fromFormId_fkey" FOREIGN KEY ("fromFormId") REFERENCES "PokemonForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Evolution" ADD CONSTRAINT "Evolution_toFormId_fkey" FOREIGN KEY ("toFormId") REFERENCES "PokemonForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
