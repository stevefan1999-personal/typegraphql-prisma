export interface CustomScalarOptions {
  field?: {
    importName?: string;
    module?: string;
  };
  graphql: {
    importName: string;
    module: string;
  };
}

export interface GenerateCodeOptions {
  outputDirPath: string;
  emitDMMF?: boolean;
  emitTranspiledCode?: boolean;
  useOriginalMapping?: boolean;
  relativePrismaOutputPath: string;
  absolutePrismaOutputPath?: string;
  simpleResolvers?: boolean;
  useUncheckedScalarInputs?: boolean;
  customScalar?: Record<string, CustomScalarOptions>;
}
