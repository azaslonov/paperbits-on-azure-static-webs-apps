import { Bag } from "@paperbits/common";
import { Logger } from "@paperbits/common/logging";
import * as AppInsights from "applicationinsights";


export class LogService implements Logger {
    private client: AppInsights.TelemetryClient;

    constructor(private readonly instrumentationKey: string) {
        AppInsights.start();
        this.client = new AppInsights.TelemetryClient(this.instrumentationKey);
    }

    public async traceSession(): Promise<void> {
        this.traceEvent(`Session started`);
    }

    public async traceEvent(eventName: string, properties?: Bag<string>, measurments?: Bag<number>): Promise<void> {
        console.log("Event: " + eventName);
        this.client.trackEvent({ name: eventName, properties: properties, measurements: measurments });
        this.client.flush();
    }

    public async traceError(error: Error, handledAt?: string): Promise<void> {
        this.client.trackException({ exception: error });
        this.client.flush();
    }

    public async traceView(name: string): Promise<void> {
        this.client.trackPageView({ name: name });
        this.client.flush();
    }
}