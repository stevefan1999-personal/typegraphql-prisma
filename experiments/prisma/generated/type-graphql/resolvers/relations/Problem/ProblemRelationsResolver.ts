import * as TypeGraphQL from "type-graphql";
import { Creator } from "../../../models/Creator";
import { Problem } from "../../../models/Problem";
import { ProblemLikedByArgs } from "./args/ProblemLikedByArgs";

@TypeGraphQL.Resolver(_of => Problem)
export class ProblemRelationsResolver {
  @TypeGraphQL.FieldResolver(_type => [Creator], {
    nullable: false
  })
  async likedBy(@TypeGraphQL.Root() problem: Problem, @TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Args() args: ProblemLikedByArgs): Promise<Creator[]> {
    return ctx.prisma.problem.findUnique({
      where: {
        id: problem.id,
      },
    }).likedBy(args);
  }

  @TypeGraphQL.FieldResolver(_type => Creator, {
    nullable: true
  })
  async creator(@TypeGraphQL.Root() problem: Problem, @TypeGraphQL.Ctx() ctx: any): Promise<Creator | null> {
    return ctx.prisma.problem.findUnique({
      where: {
        id: problem.id,
      },
    }).creator({});
  }
}
