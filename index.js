const aws = require("aws-sdk");
//awaiting credentials for config file
// const config = require("./config.json");

(async function() {
    try {
        
        aws.config.setPromisesDependency();

        aws.config.update({
            accessKeyId: config.aws.accessKey,
            secretAccessKey: config.aws.secretKey,
            region: "us-east-1"
        });

        const s3 = new aws.S3();
        const response = await s3.listObjectsV2({
            Bucket: "cru.org-storylines/index.html"
        }).promise();

        console.log(response);


    } catch (e) {
        console.log("our error", e)
    }

    debugger;
})();