package com.wandernav.wander_backend.controllers;

import com.wandernav.wander_backend.models.Group;
import com.wandernav.wander_backend.repositories.GroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class GroupController {
    @Autowired
    private GroupRepository groupRepository;

    // Create a group
    @PostMapping
    public ResponseEntity<Group> createGroup(@RequestBody Group group) {
        group.setCreatedAt(new Date());
        Group saved = groupRepository.save(group);
        return ResponseEntity.ok(saved);
    }

    // Get groups for a user
    @GetMapping
    public ResponseEntity<List<Group>> getGroups(@RequestParam String userId) {
        List<Group> groups = groupRepository.findByMemberIdsContaining(userId);
        return ResponseEntity.ok(groups);
    }
} 