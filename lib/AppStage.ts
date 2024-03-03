import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { OpenAIServiceBackendStack } from './OpenAIServiceBackendStack';

export class AppStage extends cdk.Stage {
  constructor(
    scope: Construct,
    id: string,
    environment: string,
    props?: cdk.StageProps,
  ) {
    super(scope, id, props);

    new OpenAIServiceBackendStack(this, `OpenAiServiceBackendStack`, {
      stackName: `OpenAiServiceBackendImportStack`,
    });
  }
}
