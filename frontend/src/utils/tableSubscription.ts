import { type EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";

type InsertHandler<TRow> = (ctx: EventContext, row: Infer<TRow>) => void;
type UpdateHandler<TRow> = (ctx: EventContext, oldRow: Infer<TRow>, newRow: Infer<TRow>) => void;
type DeleteHandler<TRow> = (ctx: EventContext, row: Infer<TRow>) => void;

interface TableHandlers<TRow> {
  onInsert?: InsertHandler<TRow>;
  onUpdate?: UpdateHandler<TRow>;
  onDelete?: DeleteHandler<TRow>;
}

interface TableSubscriptionConfig<TRow> {
  table: any;
  handlers: TableHandlers<TRow>;
  loadInitialData?: boolean;
}

export class TableSubscription<TRow> {
  private table: any;
  private insertHandler: InsertHandler<TRow> | null = null;
  private updateHandler: UpdateHandler<TRow> | null = null;
  private deleteHandler: DeleteHandler<TRow> | null = null;

  constructor(config: TableSubscriptionConfig<TRow>) {
    this.table = config.table;

    if (config.handlers.onInsert) {
      this.insertHandler = config.handlers.onInsert;
      this.table.onInsert(this.insertHandler);
    }

    if (config.handlers.onUpdate) {
      this.updateHandler = config.handlers.onUpdate;
      this.table.onUpdate(this.updateHandler);
    }

    if (config.handlers.onDelete) {
      this.deleteHandler = config.handlers.onDelete;
      this.table.onDelete(this.deleteHandler);
    }

    if (config.loadInitialData !== false && config.handlers.onInsert) {
      for (const row of this.table.iter()) {
        config.handlers.onInsert({} as EventContext, row);
      }
    }
  }

  unsubscribe() {
    if (this.insertHandler) {
      this.table.removeOnInsert(this.insertHandler);
      this.insertHandler = null;
    }
    if (this.updateHandler) {
      this.table.removeOnUpdate(this.updateHandler);
      this.updateHandler = null;
    }
    if (this.deleteHandler) {
      this.table.removeOnDelete(this.deleteHandler);
      this.deleteHandler = null;
    }
  }
}

export function subscribeToTable<TRow>(config: TableSubscriptionConfig<TRow>): TableSubscription<TRow> {
  return new TableSubscription(config);
}

export class MultiTableSubscription {
  private subscriptions: TableSubscription<any>[] = [];

  add<TRow>(config: TableSubscriptionConfig<TRow>): this {
    this.subscriptions.push(new TableSubscription(config));
    return this;
  }

  unsubscribe() {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
    this.subscriptions.length = 0;
  }
}

export function createMultiTableSubscription(): MultiTableSubscription {
  return new MultiTableSubscription();
}

interface MultiTableSubscriptionConfig {
  subscriptions: TableSubscriptionConfig<any>[];
}

export function subscribeToTables(config: MultiTableSubscriptionConfig): MultiTableSubscription {
  const multi = new MultiTableSubscription();
  for (const subConfig of config.subscriptions) {
    multi.add(subConfig);
  }
  return multi;
}
