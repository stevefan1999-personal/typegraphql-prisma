import { GeneratorOptions } from "@prisma/generator-helper";
import { DMMF as PrismaDMMF } from "@prisma/client/runtime";
import { promises as asyncFs } from "fs";
import path from "path";
import { unflatten } from "flat";
import _ from "lodash";
import { defaultCustomScalarSymbol } from "../utils/gen-import-alias";

import generateCode from "../generator/generate-code";
import removeDir from "../utils/removeDir";
import { GenerateCodeOptions, CustomScalarOptions } from "../generator/options";
import { toUnixPath } from "../generator/helpers";

const defaultGraphqlScalars: [string, CustomScalarOptions][] = [
  "Date",
  "Time",
  "DateTime",
  "Duration",
  "UtcOffset",
  "LocalDate",
  "LocalTime",
  "LocalEndTime",
  "EmailAddress",
  "NegativeFloat",
  "NegativeInt",
  "NonEmptyString",
  "NonNegativeFloat",
  "NonNegativeInt",
  "NonPositiveFloat",
  "NonPositiveInt",
  "PhoneNumber",
  "PositiveFloat",
  "PositiveInt",
  "PostalCode",
  "UnsignedFloat",
  "UnsignedInt",
  "URL",
  "ObjectID",
  "BigInt",
  "Long",
  "SafeInt",
  "UUID",
  "GUID",
  "HexColorCode",
  "HSL",
  "HSLA",
  "IPv4",
  "IPv6",
  "ISBN",
  "MAC",
  "Port",
  "RGB",
  "RGBA",
  "USCurrency",
  "Currency",
  "JSON",
  "JSONObject",
  "Byte",
  "Void",
].map(x => [
  x,
  { graphql: { importName: x, module: defaultCustomScalarSymbol } },
]);
const defaultCustomScalars = [...defaultGraphqlScalars];

function parseStringBoolean(stringBoolean: string | undefined) {
  return stringBoolean ? stringBoolean === "true" : undefined;
}

function resolveCustomScalar(
  oldCustomScalar?: Record<string, CustomScalarOptions>,
): Record<string, CustomScalarOptions> {
  const customScalar = _.chain(oldCustomScalar ?? {})
    // graphql not supplied -- skip
    .pickBy((value, _) => !!value.graphql)
    // graphql modules and import name not supplied -- skip
    .pickBy(
      (value, _) =>
        !!(!!value!.graphql!.module && !!value!.graphql!.importName),
    )
    .value() as Record<string, CustomScalarOptions>;

  return customScalar as Record<string, CustomScalarOptions>;
}

export async function generate(options: GeneratorOptions) {
  const outputDir = options.generator.output!;
  await asyncFs.mkdir(outputDir, { recursive: true });
  await removeDir(outputDir, true);

  const prismaClientPath = options.otherGenerators.find(
    it => it.provider === "prisma-client-js",
  )!.output!;
  const prismaClientDmmf = require(prismaClientPath)
    .dmmf as PrismaDMMF.Document;

  const generatorConfig = options.generator.config;
  const {
    customScalar = {},
  }: {
    customScalar?: Record<string, CustomScalarOptions>;
  } = unflatten(
    _.pickBy(generatorConfig, (_: string, key: string) =>
      key.startsWith("customScalar"),
    ),
    { delimiter: "_" },
  );

  const config: GenerateCodeOptions = {
    emitDMMF: parseStringBoolean(generatorConfig.emitDMMF),
    emitTranspiledCode: parseStringBoolean(generatorConfig.emitTranspiledCode),
    simpleResolvers: parseStringBoolean(generatorConfig.simpleResolvers),
    useOriginalMapping: parseStringBoolean(generatorConfig.useOriginalMapping),
    outputDirPath: outputDir,
    relativePrismaOutputPath: toUnixPath(
      path.relative(outputDir, prismaClientPath),
    ),
    absolutePrismaOutputPath: prismaClientPath.includes("node_modules")
      ? "@prisma/client"
      : undefined,
    useUncheckedScalarInputs: parseStringBoolean(
      generatorConfig.useUncheckedScalarInputs,
    ),
    customScalar: _.merge(
      resolveCustomScalar(customScalar),
      // by default we import the custom scalars from graphql-scalars
      generatorConfig.useDefaultCustomScalars ?? true
        ? Object.fromEntries(defaultCustomScalars)
        : {},
    ),
  };

  if (config.emitDMMF) {
    await Promise.all([
      asyncFs.writeFile(
        path.resolve(outputDir, "./dmmf.json"),
        JSON.stringify(options.dmmf, null, 2),
      ),
      asyncFs.writeFile(
        path.resolve(outputDir, "./prisma-client-dmmf.json"),
        JSON.stringify(prismaClientDmmf, null, 2),
      ),
    ]);
  }

  // TODO: replace with `options.dmmf` when the spec match prisma client output
  await generateCode(prismaClientDmmf, config);
  return "";
}
