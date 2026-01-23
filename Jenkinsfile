@Library('Shared') _
pipeline {
    agent { label 'Node' }

    environment {
        SONAR_HOME = tool "Sonar"
        REGISTRY = "alpha1717"
        BACKEND_IMAGE = "smarthire-server"
        FRONTEND_IMAGE = "smarthire-frontend"
    }

    parameters {
        string(
            name: 'BACKEND_IMAGE_TAG',
            defaultValue: '',
            description: 'Docker image tag for backend (e.g. v1.2.0, build-45)'
        )
        string(
            name: 'FRONTEND_IMAGE_TAG',
            defaultValue: '',
            description: 'Docker image tag for frontend (e.g. v1.2.0, build-45)'
        )
    }

    stages {

        stage("Validate Parameters") {
            steps {
                script {
                    if (!params.BACKEND_IMAGE_TAG?.trim() || !params.FRONTEND_IMAGE_TAG?.trim()) {
                        error("Both BACKEND_IMAGE_TAG and FRONTEND_IMAGE_TAG must be provided")
                    }
                }
            }
        }

        stage("Workspace cleanup") {
            steps {
                script {
                    cleanWs()
                }
            }
        }

        stage("Git: Code Checkout") {
            steps {
                script {
                    code_checkout(
                        "https://github.com/Alphahari/SmartHire.git",
                        "main"
                    )
                }
            }
        }

        stage("Trivy: Filesystem scan") {
            steps {
                script {
                    trivy_scan()
                }
            }
        }

        stage("SonarQube: Code Analysis") {
            steps {
                script {
                    sonarqube_analysis(
                        "Sonar",
                        "smarthire",
                        "smarthire"
                    )
                }
            }
        }

        stage("SonarQube: Quality Gate") {
            steps {
                script {
                    sonarqube_code_quality()
                }
            }
        }

        stage("Docker: Build Images") {
            steps {
                script {
                    dir("server") {
                        docker_build(
                            BACKEND_IMAGE,
                            params.BACKEND_IMAGE_TAG,
                            REGISTRY
                        )
                    }

                    dir("client") {
                        docker_build(
                            FRONTEND_IMAGE,
                            params.FRONTEND_IMAGE_TAG,
                            REGISTRY
                        )
                    }
                }
            }
        }

        stage("Docker: Push Images") {
            steps {
                script {
                    docker_push(BACKEND_IMAGE, params.BACKEND_IMAGE_TAG, REGISTRY)
                    docker_push(FRONTEND_IMAGE, params.FRONTEND_IMAGE_TAG, REGISTRY)
                }
            }
        }
    }

    post{
        success{
            archiveArtifacts artifacts: '*.xml', followSymlinks: false
            build job: "smarthire-CD", parameters: [
                string(name: 'FRONTEND_IMAGE_TAG', value: "${params.FRONTEND_IMAGE_TAG}"),
                string(name: 'BACKEND_IMAGE_TAG', value: "${params.BACKEND_IMAGE_TAG}")
            ]
        }
    }
}
