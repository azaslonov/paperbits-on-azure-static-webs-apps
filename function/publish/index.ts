import { AzureBlobStorage } from "@paperbits/azure";
import * as path from "path";
import * as fs from "fs";
import { InversifyInjector } from "@paperbits/common/injection";
import { IPublisher } from "@paperbits/common/publishing";
import { FormsModule } from "@paperbits/forms/forms.module";
import { CoreModule } from "@paperbits/core/core.module";
import { CorePublishModule } from "@paperbits/core/core.publish.module";
import { EmailsModule } from "@paperbits/emails/emails.module";
import { EmailsPublishModule } from "@paperbits/emails/emails.publish.module";
import { StyleModule } from "@paperbits/styles/styles.module";
import { ProseMirrorModule } from "@paperbits/prosemirror/prosemirror.module";
import { IntercomPublishModule } from "@paperbits/intercom/intercom.publish.module";
import { GoogleTagManagerPublishModule } from "@paperbits/gtm/gtm.publish.module";
import { DemoPublishModule } from "../../src/components/demo.publish.module";
import { LogService } from "./appInsightsLogger"
import { StaticSettingsProvider } from "../../src/components/staticSettingsProvider";

const logger = new LogService("InstrumentationKey=20ab0212-1608-429d-bed0-d74ff05ed444");

export async function publish(): Promise<void> {
    /* Uncomment to enable Firebase module */
    // import { FirebaseModule } from "@paperbits/firebase/firebase.admin.module";

    /* Initializing dependency injection container */
    const injector = new InversifyInjector();
    injector.bindModule(new CoreModule());
    injector.bindModule(new CorePublishModule());
    injector.bindModule(new FormsModule());
    injector.bindModule(new EmailsModule());
    injector.bindModule(new EmailsPublishModule());
    injector.bindModule(new StyleModule());
    injector.bindModule(new ProseMirrorModule());
    injector.bindModule(new IntercomPublishModule());
    injector.bindModule(new GoogleTagManagerPublishModule());

    /* Initializing Demo module */
    const dataPath = path.resolve(__dirname, "./data/demo.json");
    injector.bindModule(new DemoPublishModule(dataPath));
    injector.bindInstance("logger", logger);

    const configFile = path.resolve(__dirname, "./config.json");
    const configuration = JSON.parse(fs.readFileSync(configFile, "utf8").toString());

    const settingsProvider = new StaticSettingsProvider({
        dataPath: path.resolve(__dirname, "./data/demo.json")
    });

    const outputSettingsProvider = new StaticSettingsProvider({
        blobStorageContainer: configuration.outputBlobStorageContainer,
        blobStorageConnectionString: configuration.outputBlobStorageConnectionString
    });

    /* Storage where the website get published */
    const outputBlobStorage = new AzureBlobStorage(outputSettingsProvider);

    injector.bindInstance("settingsProvider", settingsProvider);
    injector.bindInstance("outputBlobStorage", outputBlobStorage);
    injector.resolve("autostart");

    /* Building dependency injection container */
    const publisher = injector.resolve<IPublisher>("sitePublisher");

    /* Running actual publishing */
    await publisher.publish()
    console.log(`DONE. ${(new Date()).toISOString()}`);
    logger.traceEvent(`DONE. ${(new Date()).toISOString()}`);
}

export async function run(context, req): Promise<void> {
    try {
        context.log("Publishing website...");
        await publish();
        context.log(`DONE. ${(new Date()).toISOString()}`);
        logger.traceEvent(`DONE. ${(new Date()).toISOString()}`);

        context.res = {
            status: 200,
            body: `DONE. ${(new Date()).toISOString()}`
        };
    }
    catch (error) {
        context.log.error(error);
        logger.traceError(error);

        context.res = {
            status: 500,
            body: JSON.stringify(error)
        };
    }
    finally {
        context.done();
    }
}