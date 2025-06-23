pipeline {
  agent {
    label 'slave-node'
  }

  parameters {
    booleanParam(name: 'DELETE_ECS', defaultValue: false, description: 'Delete ECS stack')
    booleanParam(name: 'DELETE_S3', defaultValue: false, description: 'Delete S3 stack (empties first)')
    booleanParam(name: 'DELETE_ECR', defaultValue: false, description: 'Delete ECR stack (empties first)')
    booleanParam(name: 'DELETE_ALB', defaultValue: false, description: 'Delete ALB stack')
    booleanParam(name: 'DELETE_RDS', defaultValue: false, description: 'Delete RDS stack')
    booleanParam(name: 'DELETE_SG', defaultValue: false, description: 'Delete SG stack')
    booleanParam(name: 'DELETE_VPC', defaultValue: false, description: 'Delete VPC stack')
  }

  environment {
    AWS_REGION = 'us-east-1'
  }

  stages {
    stage('Delete ECS Stack') {
      when { expression { return params.DELETE_ECS } }
      steps {
        script {
          def stackName = "ecs-stack"
          sh "aws cloudformation delete-stack --stack-name ${stackName} --region $AWS_REGION"
        }
      }
    }

    stage('Delete S3 Stack') {
      when { expression { return params.DELETE_S3 } }
      steps {
        script {
          def bucketName = "roche.dev.new-angular-dev-us-east-1" 
          def stackName = "my-s3-stack"

          sh "aws s3 rm s3://${bucketName} --recursive || true"
          sh "aws cloudformation delete-stack --stack-name ${stackName} --region $AWS_REGION"
        }
      }
    }

    stage('Delete ECR Stack') {
      when { expression { return params.DELETE_ECR } }
      steps {
        script {
          def repoName = "dev-backend-repo"
          def stackName = "ecr-stack"

          sh """
          IMAGE_IDS=\$(aws ecr list-images --repository-name ${repoName} --query 'imageIds[*]' --output json --region $AWS_REGION)
          if [ "\$IMAGE_IDS" != "[]" ]; then
            aws ecr batch-delete-image --repository-name ${repoName} --image-ids "\$IMAGE_IDS" --region $AWS_REGION
          fi
          """
          sh "aws cloudformation delete-stack --stack-name ${stackName} --region $AWS_REGION"
        }
      }
    }

    stage('Delete ALB Stack') {
      when { expression { return params.DELETE_ALB } }
      steps {
        script {
          def stackName = "alb-stack"
          sh "aws cloudformation delete-stack --stack-name ${stackName} --region $AWS_REGION"
        }
      }
    }

    stage('Delete RDS Stack') {
      when { expression { return params.DELETE_RDS } }
      steps {
        script {
          def stackName = "rds-stack"
          sh "aws cloudformation delete-stack --stack-name ${stackName} --region $AWS_REGION"
        }
      }
    }

    stage('Delete SG Stack') {
      when { expression { return params.DELETE_SG } }
      steps {
        script {
          def stackName = "SG-stack"
          sh "aws cloudformation delete-stack --stack-name ${stackName} --region $AWS_REGION"
        }
      }
    }

    stage('Delete VPC Stack') {
      when { expression { return params.DELETE_VPC } }
      steps {
        script {
          def stackName = "vpc-stack"
          sh "aws cloudformation delete-stack --stack-name ${stackName} --region $AWS_REGION"
        }
      }
    }
  }
}
