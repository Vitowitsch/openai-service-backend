import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import {
  Role,
  ServicePrincipal,
  PolicyStatement,
  ManagedPolicy,
} from 'aws-cdk-lib/aws-iam';
import {
  CodePipelineSource,
  CodePipeline,
  ShellStep,
} from 'aws-cdk-lib/pipelines';
import { AppStage } from './AppStage';
import { aws_s3 as s3 } from 'aws-cdk-lib';

interface MyStackProps extends cdk.StackProps {
  env: {
    account: string;
    region: string | undefined;
    bucketArtifacts: s3.Bucket;
  };
}

export class OpenAiServiceBackendPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MyStackProps) {
    super(scope, id, props);

    const repo = 'Vitowitsch/openai-service-backend';

    const pipelineRole = new Role(this, 'pipeRole', {
      assumedBy: new ServicePrincipal('codepipeline.amazonaws.com'),
    });

    pipelineRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite'),
    );

    const githubWebhookPolicyStatement = new iam.PolicyStatement({
      actions: [
        'codepipeline:PutWebhook',
        'codepipeline:UpdateWebhook',
        'codepipeline:RegisterWebhookWithThirdParty',
      ],
      resources: ['*'],
    });

    pipelineRole.addToPolicy(githubWebhookPolicyStatement);

    const githubToken = cdk.SecretValue.secretsManager('githubToken', {
      jsonField: 'GITHUB_TOKEN',
    });

    console.log('githubToken', githubToken.toString());

    const pipelineName = `OpenAIServiceBackendPipeline`;

    const pipeline = new CodePipeline(this, pipelineName, {
      dockerEnabledForSynth: true,
      dockerEnabledForSelfMutation: true,
      artifactBucket: props.env.bucketArtifacts,
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub(repo, 'main', {
          authentication: githubToken,
        }),
        commands: [
          'npm ci',
          'npm run check-format',
          'npm run lint',
          'npm run test',
          // '[ "$BRANCH" = "main" ] && npm run test:coverage || true',
          'npm run build',
          'npx cdk synth',
          'pip install checkov',
          'checkov --directory cdk.out -o sarif || true',
        ],
      }),
      synthCodeBuildDefaults: {
        rolePolicy: [
          new PolicyStatement({
            actions: ['sts:AssumeRole'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'iam:ResourceTag/aws-cdk:bootstrap-role': 'lookup',
              },
            },
          }),
        ],
      },
      role: pipelineRole,
    });

    const stageName = `Default`;

    pipeline.addStage(
      new AppStage(this, stageName, stageName, {
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT,
          region: process.env.CDK_DEFAULT_REGION,
        },
      }),
    );

    pipeline.buildPipeline();
  }
}
