import { getSecret } from '@aws-lambda-powertools/parameters/secrets';
import { Transform } from '@aws-lambda-powertools/parameters';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
  logLevel: 'INFO',
});

export type DbSecret = {
  username: string;
  password: string;
  host: string;
};

export interface ProxySecret {
  username: string;
  password: string;
  https_proxy_port: string;
  proxy_domain: string;
}

export interface ProxyConf {
  protocol: string;
  host: string;
  port: number;
  auth: {
    username: string;
    password: string;
  };
}

export interface NetCfg {
  rest_secret: CobrainerSecret;
  proxy_cfg: false | ProxyConf;
}

export type CobrainerSecret = {
  cognito_endpoint: string;
  client_id: string;
  username: string;
  password: string;
  api_endpoint: string;
  auth_endpoint?: string;
  cognito_region?: string;
};

// istanbul ignore next
export async function getAWSSecret<T>(secret_name: string): Promise<T> {
  logger.info('accessing db credentials');
  const secret = await getSecret(secret_name, {
    transform: Transform.JSON,
  });
  return secret as T;
}
