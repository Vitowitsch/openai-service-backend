import * as cdk from 'aws-cdk-lib';
import { OpenAiServiceBackendPipelineStack } from '../lib/OpenAiServiceBackendPipelineStack';
import { ArtifactBucketStack } from '../lib/ArtifactBucketStack';

const app = new cdk.App();
const artifactStack = new ArtifactBucketStack(
  app,
  `OpenAiServiceBackendArtifactBucketStack`,
  {
    env: {
      account: '944997240237',
      region: 'eu-central-1',
    },
  },
);

const openAiServiceBackendPipelineStack = new OpenAiServiceBackendPipelineStack(
  app,
  `OpenAiServiceBackendPipelineStack`,
  {
    env: {
      account: '944997240237',
      region: 'eu-central-1',
      bucketArtifacts: artifactStack.bucketDev,
    },
  },
);
openAiServiceBackendPipelineStack.addDependency(artifactStack);

app.synth();
