import type { GatherArguments } from "jsr:@shougo/ddu-vim@~9.1.0/source";
import {
  ActionFlags,
  type Actions,
  type DduItem,
  type Item,
} from "jsr:@shougo/ddu-vim@~9.1.0/types";
import { BaseSource } from "jsr:@shougo/ddu-vim@~9.1.0/source";
import type { Denops } from "jsr:@denops/std@~7.4.0";

type ActionData = { name: string };

type Params = Record<string, never>;

async function ensureOnlyOneItem(denops: Denops, items: DduItem[]) {
  if (items.length != 1) {
    await denops.call(
      "ddu#util#print_error",
      "invalid action calling: it can accept only one item",
      "ddu-source-local_ddu",
    );
    return;
  }
  return items[0];
}

export class Source extends BaseSource<Params, ActionData> {
  override kind = "file";

  override gather(
    args: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        try {
          const names = await args.denops.call(
            "ddu#custom#get_names",
          ) as string[];
          controller.enqueue(names.map((name) => {
            return {
              word: name,
              action: { name },
            };
          }));
        } finally {
          controller.close();
        }
      },
    });
  }

  override actions = {
    start: async ({ denops, items }) => {
      const item = await ensureOnlyOneItem(denops, items);
      if (!item) {
        return ActionFlags.Persist;
      }
      const name = (item.action as ActionData).name;
      await denops.call("ddu#start", { name, push: true });
      return ActionFlags.None;
    },
  } as Actions<Params>;

  override params(): Params {
    return {};
  }
}
