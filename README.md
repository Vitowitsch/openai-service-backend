# Module Description

## CI/CD

Github acts only as repo, the deployment pipe is implemented in the lib folder and running as AWS Code Pipeline:

![Alt text](image.png)

AWS lambda ecapulating the call to openai-API with token secured in AWS parameter-store (secret-type param).


## Prerequisities: 
- lz-cli
- download and run https://devstack.vwgroup.com/confluence/display/BP/How+To+-+Landing+Zone+Management+CLI
- login with cariad userid and securid token (method RSA and SRA)
* set environment:
    * `$env:AWS_DEFAULT_REGION="eu-central-1"`
    * `$env:CDK_DEFAULT_REGION="eu-central-1"`
    * `$env:AWS_DEFAULT_PROFILE=""`

-  `cdk bootstrap --profile priv-acc --trust=$CDK_DEFAULT_ACCOUNT --cloudformation-execution-policies=arn:aws:iam::aws:policy/AdministratorAccess --verbose`
-  
-  cdk deploy OpenAiServiceBackendPipelineStack --profile priv-acc
## Initial Deployment
* Manual deployment was performed once to install the Code Pipeline: `cdk deploy OpenAiServiceBackendPipelineStack`
* Changes can now be applied again manually or by merging the change to the master branch. 
  This will automatically trigger the pipeline for the new deployment.


## Local testing
- docker installed (need to cdk synth NodejsFunction, if you want to test it locally)
- `pip install aws-sam-cli` (as elevated user)
- `cdk synth OpenAiServiceBackendPipelineStack --profile priv-acc --region='eu-central-1'`
- sam local invoke OpenAiServiceBackendLambda --profile priv-acc --template-file cdk.out/OpenAiServiceBackendStack.template.json -e test/input/test_event.json

  - Note that this is not a simulation, but uses real AWS ressources.