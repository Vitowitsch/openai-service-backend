import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as kms from 'aws-cdk-lib/aws-kms';

export class ArtifactBucketStack extends cdk.Stack {
  public bucketDev: s3.Bucket;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const kmsKey = this.createKmsKey(
      `ArtifactBucketKey-OpenAiServiceBackend-${this.account}`,
    );

    const artifactBucket = new s3.Bucket(
      this,
      `PipelineOpenAiServiceBackend-${this.account}`,
      {
        bucketName: `pipeline-openapiservicebackend-${this.account}`,
        bucketKeyEnabled: true,
        encryptionKey: kmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        publicReadAccess: false,
      },
    );

    artifactBucket.addLifecycleRule({
      abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
      enabled: true,
    });

    this.bucketDev = artifactBucket;
  }
  private createKmsKey(name: string): kms.Key {
    return new kms.Key(this, name, {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pendingWindow: cdk.Duration.days(7),
      alias: `alias/${name}`,
      description: `KMS key for ${name}`,
      enableKeyRotation: false,
    });
  }
}
