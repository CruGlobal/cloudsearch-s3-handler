require("dotenv").config();
const aws = require("aws-sdk");

(async function() {
    try {
        
        aws.config.setPromisesDependency();

        aws.config.update({
            accessKeyId: process.env.ACCESS,
            secretAccessKey: process.env.SECRET,
            region: "us-east-1"
        });

        const s3 = new aws.S3();
        const response = await s3.listObjectsV2({
            Bucket: "cru.org-storylines"
        }).promise();

        console.log(response);


    } catch (e) {
        console.log("our error", e)
    }

    debugger;
})();