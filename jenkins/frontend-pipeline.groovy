pipeline {
    agent {
        label 'slave-node'
    }

    // agent any

    parameters {
        string(name: 'ENVIRONMENT', defaultValue: 'dev', description: 'Deployment environment (dev, staging, prod)')
        string(name: 'BUCKET_PREFIX', defaultValue: 'roche.dev.new', description: 'Prefix to make bucket name unique')
        string(name: 'CERT_ARN', description: 'ACM Certificate ARN for CloudFront (Required)')
    }

    environment {
        AWS_DEFAULT_REGION = 'us-east-1' 
        STACK_NAME_VPC = 'my-vpc-stack'
        STACK_NAME_S3 = 'my-s3-stack'
    }

    stages {
        stage('Checkout Code') {
            steps {
                git credentialsId: 'github', branch: 'v1-deployment', url: 'https://github.com/Roche-Micheal/devops.git'
            }
        }

        stage('Deploy S3 Stack includes s3 bucket and cloudfront distribution') {
            steps{
                dir('cloudformation/s3-cloudfront/') {
                    sh """
                    aws cloudformation deploy \
                        --template-file frontend.yaml \
                        --stack-name ${env.STACK_NAME_S3} \
                        --region ${env.AWS_DEFAULT_REGION} \
                        --capabilities CAPABILITY_NAMED_IAM \
                        --parameter-overrides \
                            Environment=${params.ENVIRONMENT} \
                            BucketPrefix=${params.BUCKET_PREFIX} \
                            CertificateArn=${params.CERT_ARN}
                    """
                }
            }  
        }

        stage('Angular app build') {
            steps {
                dir('frontend') {
                    sh """
                    npm i
                    ng build
                    """
                }
            }
        }

        stage('Upload build to S3 and make a cloudfront invalidation') {
            steps {
                script {
                    def bucketName = sh(
                        script: "aws cloudformation describe-stacks --stack-name ${env.STACK_NAME_S3} --query \"Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue\" --output text --region ${env.AWS_DEFAULT_REGION}",
                        returnStdout: true
                    ).trim()

                    def cloudfrontDistID = sh(
                        script: "aws cloudformation describe-stacks --stack-name ${env.STACK_NAME_S3} --query \"Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue\" --output text --region ${env.AWS_DEFAULT_REGION}",
                        returnStdout: true
                    ).trim()

                    sh """
                        aws s3 cp frontend/dist/myapp/browser s3://${bucketName}/ --recursive
                    """
                
                    sh """
                        aws cloudfront create-invalidation \
                        --distribution-id ${cloudfrontDistID} \
                        --paths "/*"
                    """
                }
            }
        }

    }
}
