import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import * as ssm from 'aws-cdk-lib/aws-ssm';
// import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class OpenAiServiceBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaExecutionRole = this.createLambdaExecutionRole();
    const lambdaFct = this.createNodejsFunction(lambdaExecutionRole);

    const apiName = 'OpenAiRestApi';
    const api = new LambdaRestApi(this, apiName, {
      restApiName: apiName,
      description:
        'used to provide access to the backend to encapsulate the chatgpt token',
      handler: lambdaFct,
      proxy: false,
    });

    const resource = api.root.addResource('myresource');
    resource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFct), {
      authorizationType: apigateway.AuthorizationType.NONE,
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    resource.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: apigateway.Cors.ALL_METHODS,
      allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
    });

    const endpointName = 'EndpointURL4OpenAiBackend';
    new ssm.StringParameter(this, endpointName, {
      parameterName: endpointName,
      stringValue: api.url,
      description: `The URL for Lambda Gateway of openai backend.`,
    });
  }

  private createLambdaExecutionRole() {
    const lambdaExecutionRole = new iam.Role(
      this,
      `OpenAIServiceBackendLambdaExecutionRole`,
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      },
    );

    lambdaExecutionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole',
      ),
    );
    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue', 'ssm:GetParameter'],
        resources: [
          'arn:aws:secretsmanager:eu-central-1:944997240237:secret:apenai-gpt-token-y2brc7',
        ],
      }),
    );

    return lambdaExecutionRole;
  }

  private createNodejsFunction(lambdaExecutionRole: iam.Role): NodejsFunction {
    return new NodejsFunction(this, `OpenAiServiceBackendLambda`, {
      entry: 'src/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(900),
      role: lambdaExecutionRole,
      environment: {
        REGION: this.region,
      },
      reservedConcurrentExecutions: 15,
    });
  }
}
