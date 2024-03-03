import { getAWSSecret } from "../src/infrastructure";
import { getSecret } from "@aws-lambda-powertools/parameters/secrets";
import { Transform } from "@aws-lambda-powertools/parameters";

jest.mock("stream");
jest.mock("@aws-lambda-powertools/parameters/secrets");

describe("Infrastructure Tests", () => {
  describe("getSecrets", () => {
    // it("should return secrets", async () => {
    //   const mockSecrets = {
    //     username: "testUser",
    //     password: "testPassword",
    //     host: "testHost",
    //   };
    //   process.env.SECRET_NAME = "testSecret";

    //   const result = await getSecrets();

    //   expect(getSecret).toHaveBeenCalledWith("testSecret", {
    //     transform: Transform.JSON,
    //   });
    //   expect(result).toEqual(mockSecrets);
    // });

    it("should default secret when SECRET_NAME is undefined", async () => {
      const mockSecrets = {
        username: "testUser",
        password: "testPassword",
        host: "testHost",
      };
      delete process.env.SECRET_NAME;
      (getSecret as jest.Mock).mockResolvedValue(mockSecrets);

      await getAWSSecret("dbsec");
      expect(getSecret).toHaveBeenCalledWith("dbsec", {
        transform: Transform.JSON,
      });
    });
  });
});
