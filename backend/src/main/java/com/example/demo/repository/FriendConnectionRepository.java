package com.example.demo.repository;

import com.example.demo.model.ConnectionStatus;
import com.example.demo.model.FriendConnection;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FriendConnectionRepository extends JpaRepository<FriendConnection, UUID> {

    Optional<FriendConnection> findByUserAAndUserB(User userA, User userB);

    Optional<FriendConnection> findByUserAAndUserBAndStatus(User userA, User userB, ConnectionStatus status);

    @Query("SELECT c FROM FriendConnection c " +
           "JOIN FETCH c.requestedBy " +
           "WHERE (c.userA = :user OR c.userB = :user) " +
           "AND c.requestedBy != :user " +
           "AND c.status = com.example.demo.model.ConnectionStatus.PENDING " +
           "ORDER BY c.createdAt DESC")
    List<FriendConnection> findIncomingPendingRequests(@Param("user") User user);

    @Query("SELECT c FROM FriendConnection c " +
           "JOIN FETCH c.userA " +
           "JOIN FETCH c.userB " +
           "WHERE (c.userA = :user OR c.userB = :user) " +
           "AND c.status = com.example.demo.model.ConnectionStatus.ACCEPTED " +
           "ORDER BY c.respondedAt DESC")
    List<FriendConnection> findAcceptedConnections(@Param("user") User user);

    @Query("SELECT c FROM FriendConnection c " +
           "WHERE ((c.userA = :u1 AND c.userB = :u2) OR (c.userA = :u2 AND c.userB = :u1))")
    Optional<FriendConnection> findConnectionBetweenUsers(@Param("u1") User u1, @Param("u2") User u2);

    @Query("SELECT c FROM FriendConnection c " +
           "WHERE ((c.userA = :u1 AND c.userB = :u2) OR (c.userA = :u2 AND c.userB = :u1)) " +
           "AND c.status = com.example.demo.model.ConnectionStatus.ACCEPTED")
    Optional<FriendConnection> findAcceptedConnectionBetweenUsers(@Param("u1") User u1, @Param("u2") User u2);
}
