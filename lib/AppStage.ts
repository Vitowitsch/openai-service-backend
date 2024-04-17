import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { OpenAiServiceBackendStack } from './OpenAiServiceBackendStack';

export class AppStage extends cdk.Stage {
  constructor(
    scope: Construct,
    id: string,
    environment: string,
    props?: cdk.StageProps,
  ) {
    super(scope, id, props);

    new OpenAiServiceBackendStack(this, `OpenAiServiceBackendStack`, {
      stackName: `OpenAiServiceBackendImportStack`,
    });
  }
}
