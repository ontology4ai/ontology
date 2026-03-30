package com.asiainfo.modo;

import io.github.suanchou.driver.repo.AbstractRepositoryFactoryBean;
import org.springframework.boot.SpringApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;


@ModoApplication
public class OntologyApplicationDeploy {


	public static void main(String[] args) {
	        SpringApplication.run(OntologyApplicationDeploy.class, args);
	    }

}
