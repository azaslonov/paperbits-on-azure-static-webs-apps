import { Bag } from "@paperbits/common";
import { Logger } from "@paperbits/common/logging";
import * as AppInsights from "applicationinsights";


export class LogService implements Logger {
    constructor(private readonly instrumentationKey: string) {
        AppInsights.setup(this.instrumentationKey).start();
    }

    public async traceSession(): Promise<void> {
        this.traceEvent(`Session started`);
    }

    public async traceEvent(eventName: string, properties?: Bag<string>, measurments?: Bag<number>): Promise<void> {
        AppInsights.defaultClient.trackEvent({ name: eventName, properties: properties, measurements: measurments });
    }

    public async traceError(error: Error, handledAt?: string): Promise<void> {
        AppInsights.defaultClient.trackException({ exception: error });
    }

    public async traceView(name: string): Promise<void> {
        AppInsights.defaultClient.trackPageView({ name: name });
    }
}