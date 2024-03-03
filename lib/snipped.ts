// import * as cdk from '@aws-cdk/core';
// import * as lambda from '@aws-cdk/aws-lambda';
// import * as apigateway from '@aws-cdk/aws-apigateway';
// import * as secretsmanager from '@aws-cdk/aws-secretsmanager';

// export class MyStack extends cdk.Stack {
//   constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
//     super(scope, id, props);

//     // Define the Lambda function
//     const myLambda = new lambda.Function(this, 'MyFunction', {
//       runtime: lambda.Runtime.NODEJS_14_X,
//       handler: 'index.handler',
//       code: lambda.Code.fromAsset('path/to/your/code'),
//       environment: {
//         OPENAI_API_KEY: secretsmanager.Secret.fromSecretNameV2(
//           this,
//           'OpenAiApiKey',
//           'secretName',
//         ).secretValue.toString(),
//       },
//     });

//     // Define the API Gateway
//     const api = new apigateway.RestApi(this, 'MyApi', {
//       restApiName: 'My Service API',
//       description: 'This service serves XYZ.',
//       // Configure authorizers, throttling, etc.
//     });

//     // Add a resource and method to the API Gateway
//     const resource = api.root.addResource('myresource');
//     resource.addMethod('GET', new apigateway.LambdaIntegration(myLambda), {
//       // Add authorizer and throttling options
//     });

//     // Add more configurations as needed
//   }
// }
