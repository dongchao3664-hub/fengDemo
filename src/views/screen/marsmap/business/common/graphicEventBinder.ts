import * as mars3d from "mars3d";

export type Mars3DEventKey = keyof typeof mars3d.EventType;

export interface GraphicEventPayload {
  graphic: any;
  rawEvent: any;
  eventName: Mars3DEventKey;
}

export type GraphicEventHandlers = Partial<
  Record<Mars3DEventKey, (payload: GraphicEventPayload) => void>
>;

/**
 * Utility that binds mars3d graphic events and returns an unbind function.
 */
export function attachGraphicEvents(
  graphic: any,
  handlers: GraphicEventHandlers
): () => void {
  if (!graphic?.on || !handlers) {
    return () => {};
  }

  const disposers: Array<() => void> = [];

  (Object.keys(handlers) as Mars3DEventKey[]).forEach((eventName) => {
    const handler = handlers[eventName];
    if (!handler) {
      return;
    }

    const eventType = mars3d.EventType[eventName];
    if (!eventType) {
      console.warn(`[attachGraphicEvents] Unsupported event "${eventName}"`);
      return;
    }

    const wrapped = (event: any) =>
      handler({
        graphic,
        rawEvent: event,
        eventName,
      });

    graphic.on(eventType, wrapped);
    disposers.push(() => graphic.off?.(eventType, wrapped));
  });

  return () => {
    while (disposers.length) {
      const dispose = disposers.pop();
      dispose?.();
    }
  };
}
