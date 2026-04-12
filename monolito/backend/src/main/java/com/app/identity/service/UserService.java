package com.app.identity.service;

import java.util.List;
import java.util.UUID;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.identity.dto.DesignerResponse;
import com.app.identity.dto.DesignersPage;
import com.app.identity.dto.DeveloperResponse;
import com.app.identity.dto.DevelopersPage;
import com.app.identity.dto.PageInfo;
import com.app.identity.dto.QuoterResponse;
import com.app.identity.dto.QuotersPage;
import com.app.identity.dto.SalesResponse;
import com.app.identity.dto.SalesPage;
import com.app.identity.dto.UserResponse;
import com.app.identity.repository.DesignerRepository;
import com.app.identity.repository.QuoterRepository;
import com.app.identity.repository.SalesRepository;
import com.app.identity.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final QuoterRepository quoterRepository;
    private final SalesRepository salesRepository;
    private final DesignerRepository designerRepository;

    private UserResponse getUserResponse(UUID userId) {
        return userRepository.findById(userId)
                .map(UserResponse::new)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ── Quoters ──────────────────────────────────────────────

    public QuoterResponse getQuoterInfo(UUID userId) {
        UserResponse ur = getUserResponse(userId);
        var q = quoterRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Quoter not found"));
        return new QuoterResponse(ur, q.getQuoted(), q.getProjects(), q.getProducts());
    }

    @Transactional
    @CacheEvict(value = "quoters", allEntries = true)
    public QuoterResponse updateQuoterInfo(UUID userId, Integer quoted, Integer projects, Integer products) {
        UserResponse ur = getUserResponse(userId);
        var q = quoterRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Quoter not found"));
        q.setQuoted(quoted);
        q.setProjects(projects);
        q.setProducts(products);
        var saved = quoterRepository.save(q);
        return new QuoterResponse(ur, saved.getQuoted(), saved.getProjects(), saved.getProducts());
    }

    @Cacheable(value = "quoters", unless = "#result.isEmpty()")
    public List<QuoterResponse> getAllQuoters() {
        return quoterRepository.findAllWithUser().stream()
                .map(q -> new QuoterResponse(
                        new UserResponse(q.getUser()),
                        q.getQuoted(), q.getProjects(), q.getProducts()))
                .toList();
    }

    public QuotersPage getQuotersPaginated(Integer limit, Integer offset) {
        if (limit == null || limit <= 0) {
            List<QuoterResponse> items = getAllQuoters();
            return new QuotersPage(items, new PageInfo(items.size(), items.size(), 0));
        }
        int off = offset != null && offset >= 0 ? offset : 0;
        Pageable pageable = PageRequest.of(off / limit, limit);
        var page = quoterRepository.findAllWithUser(pageable);
        List<QuoterResponse> items = page.getContent().stream()
                .map(q -> new QuoterResponse(new UserResponse(q.getUser()),
                        q.getQuoted(), q.getProjects(), q.getProducts()))
                .toList();
        return new QuotersPage(items, new PageInfo((int) page.getTotalElements(), limit, off));
    }

    // ── Sales ────────────────────────────────────────────────

    public SalesResponse getSalesInfo(UUID userId) {
        UserResponse ur = getUserResponse(userId);
        var s = salesRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Sales not found"));
        return new SalesResponse(ur, s.getRequested(), s.getEffective());
    }

    @Transactional
    @CacheEvict(value = "sales", allEntries = true)
    public SalesResponse updateSalesInfo(UUID userId, Integer requested, Integer effective) {
        UserResponse ur = getUserResponse(userId);
        var s = salesRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Sales not found"));
        s.setRequested(requested);
        s.setEffective(effective);
        var saved = salesRepository.save(s);
        return new SalesResponse(ur, saved.getRequested(), saved.getEffective());
    }

    @Cacheable(value = "sales", unless = "#result.isEmpty()")
    public List<SalesResponse> getAllSales() {
        return salesRepository.findAllWithUser().stream()
                .map(s -> new SalesResponse(
                        new UserResponse(s.getUser()),
                        s.getRequested(), s.getEffective()))
                .toList();
    }

    public SalesPage getSalesPaginated(Integer limit, Integer offset) {
        if (limit == null || limit <= 0) {
            List<SalesResponse> items = getAllSales();
            return new SalesPage(items, new PageInfo(items.size(), items.size(), 0));
        }
        int off = offset != null && offset >= 0 ? offset : 0;
        Pageable pageable = PageRequest.of(off / limit, limit);
        var page = salesRepository.findAllWithUser(pageable);
        List<SalesResponse> items = page.getContent().stream()
                .map(s -> new SalesResponse(new UserResponse(s.getUser()),
                        s.getRequested(), s.getEffective()))
                .toList();
        return new SalesPage(items, new PageInfo((int) page.getTotalElements(), limit, off));
    }

    // ── Designers ────────────────────────────────────────────

    public DesignerResponse getDesignerInfo(UUID userId) {
        UserResponse ur = getUserResponse(userId);
        var d = designerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Designer not found"));
        return new DesignerResponse(ur, d.getCreated(), d.getEdited());
    }

    @Transactional
    @CacheEvict(value = "designers", allEntries = true)
    public DesignerResponse updateDesignerInfo(UUID userId, Integer created, Integer edited) {
        UserResponse ur = getUserResponse(userId);
        var d = designerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Designer not found"));
        d.setCreated(created);
        d.setEdited(edited);
        var saved = designerRepository.save(d);
        return new DesignerResponse(ur, saved.getCreated(), saved.getEdited());
    }

    @Cacheable(value = "designers", unless = "#result.isEmpty()")
    public List<DesignerResponse> getAllDesigners() {
        return designerRepository.findAllWithUser().stream()
                .map(d -> new DesignerResponse(
                        new UserResponse(d.getUser()),
                        d.getCreated(), d.getEdited()))
                .toList();
    }

    public DesignersPage getDesignersPaginated(Integer limit, Integer offset) {
        if (limit == null || limit <= 0) {
            List<DesignerResponse> items = getAllDesigners();
            return new DesignersPage(items, new PageInfo(items.size(), items.size(), 0));
        }
        int off = offset != null && offset >= 0 ? offset : 0;
        Pageable pageable = PageRequest.of(off / limit, limit);
        var page = designerRepository.findAllWithUser(pageable);
        List<DesignerResponse> items = page.getContent().stream()
                .map(d -> new DesignerResponse(new UserResponse(d.getUser()),
                        d.getCreated(), d.getEdited()))
                .toList();
        return new DesignersPage(items, new PageInfo((int) page.getTotalElements(), limit, off));
    }

    // ── Developers ───────────────────────────────────────────

    @Cacheable(value = "developers", unless = "#result.isEmpty()")
    public List<DeveloperResponse> getAllDevelopers() {
        return userRepository.findByRole("DEVELOPMENT").stream()
                .map(u -> new DeveloperResponse(new UserResponse(u)))
                .toList();
    }

    public DevelopersPage getDevelopersPaginated(Integer limit, Integer offset) {
        if (limit == null || limit <= 0) {
            List<DeveloperResponse> items = getAllDevelopers();
            return new DevelopersPage(items, new PageInfo(items.size(), items.size(), 0));
        }
        int off = offset != null && offset >= 0 ? offset : 0;
        Pageable pageable = PageRequest.of(off / limit, limit);
        var page = userRepository.findByRole("DEVELOPMENT", pageable);
        List<DeveloperResponse> items = page.getContent().stream()
                .map(u -> new DeveloperResponse(new UserResponse(u)))
                .toList();
        return new DevelopersPage(items, new PageInfo((int) page.getTotalElements(), limit, off));
    }
}
