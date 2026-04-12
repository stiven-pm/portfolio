package com.app.identity.events;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.identity.repository.QuoterRepository;
import com.app.identity.repository.SalesRepository;
import com.app.shared.events.ProductQuotedEvent;
import com.app.shared.events.ProjectCreatedEvent;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class IdentityEventListener {

    private final QuoterRepository quoterRepository;
    private final SalesRepository salesRepository;

    @EventListener
    @Transactional
    public void onProjectCreated(ProjectCreatedEvent event) {
        quoterRepository.findByUserId(event.quoterId()).ifPresent(quoter -> {
            quoter.setProjects(quoter.getProjects() + 1);
            quoter.setProducts(quoter.getProducts() + event.products());
            quoterRepository.save(quoter);
        });

        salesRepository.findByUserId(event.salesId()).ifPresent(sales -> {
            sales.setRequested(sales.getRequested() + 1);
            salesRepository.save(sales);
        });
    }

    @EventListener
    @Transactional
    public void onProductQuoted(ProductQuotedEvent event) {
        if (event.requireUpdate()) {
            quoterRepository.findByUserId(event.quoterId()).ifPresent(quoter -> {
                quoter.setQuoted(quoter.getQuoted() + 1);
                quoterRepository.save(quoter);
            });
        }
    }
}
