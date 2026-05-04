package com.example.HomestayDev.config;

import org.camunda.bpm.engine.*;
import org.camunda.bpm.engine.impl.cfg.StandaloneProcessEngineConfiguration;
import org.camunda.bpm.engine.spring.ProcessEngineFactoryBean;
import org.camunda.bpm.engine.spring.SpringProcessEngineConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.io.IOException;

/**
 * Manual Camunda 7 engine configuration for Spring Boot 4.
 *
 * The official Camunda Spring Boot starters (camunda-bpm-spring-boot-starter)
 * only support Spring Boot up to 3.x. Spring Boot 4 removed several APIs
 * (Jersey, HibernateJpaAutoConfiguration etc.) that those starters depend on.
 *
 * This configuration wires the Camunda engine directly using
 * camunda-engine-spring-6 (the Jakarta EE / Spring 6 compatible module).
 */
@Configuration
public class CamundaConfig {



    @Bean
    public SpringProcessEngineConfiguration processEngineConfiguration(
            DataSource dataSource,
            PlatformTransactionManager transactionManager) throws IOException {
        SpringProcessEngineConfiguration config = new SpringProcessEngineConfiguration();

        config.setDataSource(dataSource);
        config.setTransactionManager(transactionManager);

        // Auto-create / update Camunda schema tables in SQL Server
        config.setDatabaseSchemaUpdate(StandaloneProcessEngineConfiguration.DB_SCHEMA_UPDATE_TRUE);

        // Default historyTimeToLive (ISO 8601: 180 days) — required by Camunda 7.20+
        // Each BPMN process should also declare camunda:historyTimeToLive="P180D"
        config.setHistoryTimeToLive("P180D");

        // Automatically deploy all .bpmn files found in classpath root
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources = resolver.getResources("classpath*:*.bpmn");
        if (resources.length > 0) {
            config.setDeploymentResources(resources);
        }

        // Do NOT activate job executor here — it activates automatically after context is ready
        config.setJobExecutorActivate(false);

        // Use the default engine name
        config.setProcessEngineName(ProcessEngines.NAME_DEFAULT);

        return config;
    }

    @Bean
    public ProcessEngineFactoryBean processEngine(
            SpringProcessEngineConfiguration processEngineConfiguration) {
        ProcessEngineFactoryBean factory = new ProcessEngineFactoryBean();
        factory.setProcessEngineConfiguration(processEngineConfiguration);
        return factory;
    }

    // Expose all Camunda services as Spring beans
    @Bean
    public RepositoryService repositoryService(ProcessEngine processEngine) {
        return processEngine.getRepositoryService();
    }

    @Bean
    public RuntimeService runtimeService(ProcessEngine processEngine) {
        return processEngine.getRuntimeService();
    }

    @Bean
    public TaskService taskService(ProcessEngine processEngine) {
        return processEngine.getTaskService();
    }

    @Bean
    public HistoryService historyService(ProcessEngine processEngine) {
        return processEngine.getHistoryService();
    }

    @Bean
    public ManagementService managementService(ProcessEngine processEngine) {
        return processEngine.getManagementService();
    }
}
