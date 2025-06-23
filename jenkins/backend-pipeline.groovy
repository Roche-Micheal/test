pipeline {
    agent {
        label 'slave-node'
    }

    // agent any

    parameters {
        string(name: 'ENVIRONMENT', defaultValue: 'dev', description: 'Deployment environment')
        string(name: 'ACM_ARN', defaultValue: '', description: 'ACM Certificate ARN for HTTPS (e.g., api.rochedev.info)')
    }

    environment {
        AWS_DEFAULT_REGION = 'us-east-1'
        VPC_STACK_NAME = 'vpc-stack'
        SG_STACK_NAME = 'SG-stack'
        RDS_STACK_NAME = 'rds-stack'
        ECR_STACK_NAME = 'ecr-stack'
        ALB_STACK_NAME = 'alb-stack'
        ECS_STACK_NAME = 'ecs-stack'
        CLUSTER_NAME = "${params.ENVIRONMENT}-cluster"
        CONTAINER_NAME = "backend-app"
        IMAGE_NAME = "node-app"
    }

    stages {
        stage('Checkout Code') {
            steps {
                git credentialsId: 'github', branch: 'v1-deployment', url: 'https://github.com/Roche-Micheal/devops.git'
            }
        }

        stage('Deploy VPC Stack') {
            steps {
                dir('cloudformation/network/') {
                    sh """
                    aws cloudformation deploy \
                        --template-file vpc.yaml \
                        --stack-name ${env.VPC_STACK_NAME} \
                        --region ${env.AWS_DEFAULT_REGION} \
                        --capabilities CAPABILITY_NAMED_IAM \
                        --parameter-overrides Environment=${params.ENVIRONMENT}
                    """
                }
            }
        }

        stage('Deploy Security Stack') {
            steps {
                dir('cloudformation/security/') {
                    script {
                        def vpc_id = sh(
                            script: "aws cloudformation describe-stacks --stack-name ${env.VPC_STACK_NAME} --query \"Stacks[0].Outputs[?OutputKey=='VPCId'].OutputValue\" --output text",
                            returnStdout: true
                        ).trim()

                        sh """
                        aws cloudformation deploy \
                            --template-file security-groups.yaml \
                            --stack-name ${env.SG_STACK_NAME} \
                            --region ${env.AWS_DEFAULT_REGION} \
                            --capabilities CAPABILITY_NAMED_IAM \
                            --parameter-overrides Environment=${params.ENVIRONMENT} VpcId=${vpc_id}
                        """
                    }
                }
            }
        }

        stage('Deploy ECR') {
            steps {
                dir('cloudformation/ecs/') {
                    sh """
                    aws cloudformation deploy \
                      --template-file ecr.yaml \
                      --stack-name ${env.ECR_STACK_NAME} \
                      --region ${env.AWS_DEFAULT_REGION} \
                      --capabilities CAPABILITY_NAMED_IAM \
                      --parameter-overrides Environment=${params.ENVIRONMENT}
                    """
                }
            }
        }

        stage('Build docker image and push it in Ecr'){
            steps {
                dir('backend'){
                    script {
                        def ecr_repo_uri = sh(script: "aws cloudformation describe-stacks --stack-name ${env.ECR_STACK_NAME} --query \"Stacks[0].Outputs[?OutputKey=='ECRRepoURI'].OutputValue\" --output text", returnStdout: true).trim()

                        sh """
                            aws ecr get-login-password --region ${AWS_DEFAULT_REGION} | docker login --username AWS --password-stdin ${ecr_repo_uri}
                            docker build -t ${IMAGE_NAME}:latest-1 .
                            docker tag ${IMAGE_NAME}:latest-1 ${ecr_repo_uri}:latest-1
                            docker push ${ecr_repo_uri}:latest-1
                        """
                    }
                }
            }
        }

        stage('Deploy ALB') {
            steps {
                dir('cloudformation/alb/') {
                    script {
                        def public1 = sh(script: "aws cloudformation describe-stacks --stack-name ${env.VPC_STACK_NAME} --query \"Stacks[0].Outputs[?OutputKey=='PublicSubnet1'].OutputValue\" --output text", returnStdout: true).trim()
                        def public2 = sh(script: "aws cloudformation describe-stacks --stack-name ${env.VPC_STACK_NAME} --query \"Stacks[0].Outputs[?OutputKey=='PublicSubnet2'].OutputValue\" --output text", returnStdout: true).trim()
                        def alb_sg = sh(script: "aws cloudformation describe-stacks --stack-name ${env.SG_STACK_NAME} --query \"Stacks[0].Outputs[?OutputKey=='ALBSecurityGroupId'].OutputValue\" --output text", returnStdout: true).trim()
                        def vpc_id = sh(script: "aws cloudformation describe-stacks --stack-name ${env.VPC_STACK_NAME} --query \"Stacks[0].Outputs[?OutputKey=='VPCId'].OutputValue\" --output text", returnStdout: true).trim()

                        sh """
                        aws cloudformation deploy \
                          --template-file alb.yaml \
                          --stack-name ${env.ALB_STACK_NAME} \
                          --region ${env.AWS_DEFAULT_REGION} \
                          --capabilities CAPABILITY_NAMED_IAM \
                          --parameter-overrides \
                              Environment=${params.ENVIRONMENT} \
                              VpcId=${vpc_id} \
                              Subnet1=${public1} \
                              Subnet2=${public2} \
                              BackendSG=${alb_sg} \
                              ACMCertificateArn=${params.ACM_ARN}
                        """
                    }
                }
            }
        }

        stage('Deploy ECS') {
            steps {
                dir('cloudformation/ecs/') {
                    script {
                        def private1 = sh(script: "aws cloudformation describe-stacks --stack-name ${env.VPC_STACK_NAME} --query \"Stacks[0].Outputs[?OutputKey=='PrivateSubnet1'].OutputValue\" --output text", returnStdout: true).trim()
                        def private2 = sh(script: "aws cloudformation describe-stacks --stack-name ${env.VPC_STACK_NAME} --query \"Stacks[0].Outputs[?OutputKey=='PrivateSubnet2'].OutputValue\" --output text", returnStdout: true).trim()
                        def public1 = sh(script: "aws cloudformation describe-stacks --stack-name ${env.VPC_STACK_NAME} --query \"Stacks[0].Outputs[?OutputKey=='PublicSubnet1'].OutputValue\" --output text", returnStdout: true).trim()
                        def public2 = sh(script: "aws cloudformation describe-stacks --stack-name ${env.VPC_STACK_NAME} --query \"Stacks[0].Outputs[?OutputKey=='PublicSubnet2'].OutputValue\" --output text", returnStdout: true).trim()
                        def backend_sg = sh(script: "aws cloudformation describe-stacks --stack-name ${env.SG_STACK_NAME} --query \"Stacks[0].Outputs[?OutputKey=='BackendSecurityGroupId'].OutputValue\" --output text", returnStdout: true).trim()
                        def target_arn = sh(script: "aws cloudformation describe-stacks --stack-name ${env.ALB_STACK_NAME} --query \"Stacks[0].Outputs[?OutputKey=='TargetGroupArn'].OutputValue\" --output text", returnStdout: true).trim()
                        // def rds_host = sh(script: "aws cloudformation describe-stacks --stack-name ${env.RDS_STACK_NAME} --query \"Stacks[0].Outputs[?OutputKey=='DBEndpoint'].OutputValue\" --output text", returnStdout: true).trim()
                        def vpc_id = sh(script: "aws cloudformation describe-stacks --stack-name ${env.VPC_STACK_NAME} --query \"Stacks[0].Outputs[?OutputKey=='VPCId'].OutputValue\" --output text", returnStdout: true).trim()

                        def ecr_repo_uri = sh(script: "aws cloudformation describe-stacks --stack-name ${env.ECR_STACK_NAME} --query \"Stacks[0].Outputs[?OutputKey=='ECRRepoURI'].OutputValue\" --output text", returnStdout: true).trim()

                        sh """
                        aws cloudformation deploy \
                          --template-file ecs-backend.yaml \
                          --stack-name ${env.ECS_STACK_NAME} \
                          --region ${env.AWS_DEFAULT_REGION} \
                          --capabilities CAPABILITY_NAMED_IAM \
                          --parameter-overrides \
                              Environment=${params.ENVIRONMENT} \
                              VpcId=${vpc_id} \
                              PrivateSubnet1=${public1} \
                              PrivateSubnet2=${public2} \
                              BackendSecurityGroupId=${backend_sg} \
                              TargetGroupArn=${target_arn} \
                              ClusterName=${env.CLUSTER_NAME} \
                              ContainerName=${env.CONTAINER_NAME} \
                              ImageUrl=${ecr_repo_uri}:latest-1
                        """
                    }
                }
            }
        }
    }
}
