package ballware.keycloak.userapi;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.Encoded;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.OPTIONS;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;

import org.apache.commons.lang3.StringUtils;
import org.jboss.resteasy.annotations.cache.NoCache;
import org.keycloak.http.HttpRequest;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RoleModel;
import org.keycloak.models.UserModel;
import org.keycloak.services.managers.AppAuthManager;
import org.keycloak.services.managers.AuthenticationManager.AuthResult;
import org.keycloak.services.resource.RealmResourceProvider;
import org.keycloak.services.cors.Cors;
import org.keycloak.utils.MediaType;

import ballware.keycloak.userapi.model.User;
import ballware.keycloak.userapi.model.UserClaim;
import ballware.keycloak.userapi.model.UserRole;
import ballware.keycloak.userapi.model.UserSelectlistEntry;

public class UserRestProvider implements RealmResourceProvider {
    private final KeycloakSession session;
    private final AuthResult auth;
    
    public UserRestProvider(KeycloakSession session) {
        this.session = session;
        this.auth = new AppAuthManager.BearerTokenAuthenticator(session).authenticate();
    }

    public void close() {

    }

    public Object getResource() {
        return this;
    }

    @OPTIONS
	@Path("{any:.*}")
	public Response preflight() {
		HttpRequest request = session.getContext().getHttpRequest();
		return Cors.add(request, Response.ok()).auth().allowedMethods("OPTIONS", "GET", "POST", "DELETE").preflight().build();
	}

    @GET
    @Path("all")
    @NoCache
    @Produces({MediaType.APPLICATION_JSON})
    @Encoded
    public Response getAllUsers(String identifier) {
        
        String tenant = assertUserHasTenant();
        
        if (!(userHasClaim("right", "identity.user.view") || userHasClaim("right", "tenant.user.view"))) {
            throw new ForbiddenException();
        }

        HttpRequest request = session.getContext().getHttpRequest();

        return Cors.add(request, Response
            .ok(session.users().searchForUserStream(session.getContext().getRealm(), "")
                .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                .map(e -> toUserDetail(e, 
                    e.getRealmRoleMappingsStream()
                        .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                        .collect(Collectors.toList())
                ))
                .collect(Collectors.toList()))
            ).auth().allowAllOrigins().build();
    }

    @GET
    @Path("byId")
    @NoCache
    @Produces({MediaType.APPLICATION_JSON})
    @Encoded
    public Response getUserById(
        @QueryParam("identifier") String identifier, 
        @QueryParam("id") String id) {
        
        String tenant = assertUserHasTenant();

        if (!(userHasClaim("right", "identity.user.view") || userHasClaim("right", "tenant.user.view"))) {
            throw new ForbiddenException();
        }

        HttpRequest request = session.getContext().getHttpRequest();

        UserModel user = session.users().getUserById(session.getContext().getRealm(), id);

        if (user != null && user.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant)) {
            return Cors.add(request, Response
                .ok(this.toUserDetail(user,                
                    user.getRealmRoleMappingsStream()
                        .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                        .collect(Collectors.toList())
                ))
            ).auth().allowAllOrigins().build();    
        }

        return Cors.add(request, Response
            .status(Status.NOT_FOUND)            
        ).auth().allowAllOrigins().build();
    }


    @GET
    @Path("new")
    @NoCache
    @Produces({MediaType.APPLICATION_JSON})
    @Encoded
    public Response getNewUser(String identifier) {
        
        assertUserHasTenant();

        if (!(userHasClaim("right", "identity.user.add") || userHasClaim("right", "tenant.user.add"))) {
            throw new ForbiddenException();
        }
        
        HttpRequest request = session.getContext().getHttpRequest();

        return Cors.add(request, Response
            .ok(new User(UUID.randomUUID().toString(), "", "", "", "", false, null, null, null))
            ).auth().allowAllOrigins().build();
    }

    @POST
    @Path("save")
    @NoCache
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Encoded
    public Response saveUser(
        @QueryParam("identifier") String identifier, User user) {

        String tenant = assertUserHasTenant();
        assertAuthenticatedUser();

        Map<String, List<String>> foldedClaims = new HashMap<String, List<String>>();

        if (user.getUserClaims() != null) {
            user.getUserClaims().forEach(cl -> {
                if (!foldedClaims.containsKey(cl.getClaimType())) {
                    foldedClaims.put(cl.getClaimType(), new ArrayList<String>());
                }

                foldedClaims.get(cl.getClaimType()).add(cl.getClaimValue());
            });
        }
        
        HttpRequest request = session.getContext().getHttpRequest();

        UserModel existingUser = session.users().getUserById(session.getContext().getRealm(), user.getId());

        if (existingUser != null && existingUser.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant)) {
            
            if (!(userHasClaim("right", "identity.user.edit") || userHasClaim("right", "tenant.user.edit"))) {
                throw new ForbiddenException();
            }

            existingUser.setFirstName(user.getFirstName());
            existingUser.setLastName(user.getLastName());
            existingUser.setEnabled(user.getEnabled());

            foldedClaims.forEach((key, value) -> {
                existingUser.setAttribute(key, value);
            });

            if (user.getUserRoles() != null) {
                List<String> newRoles = user.getUserRoles().stream().map(r -> r.getRoleId()).collect(Collectors.toList());

                List<String> existingRoles = existingUser.getRealmRoleMappingsStream()
                    .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                    .map(r -> r.getId())
                    .collect(Collectors.toList());

                existingRoles.forEach(role -> {
                    if (!newRoles.contains(role)) {
                        RoleModel exististingRole = session.roles().getRoleById(session.getContext().getRealm(), role);
                    
                        existingUser.deleteRoleMapping(exististingRole);
                    }
                });

                newRoles.forEach(role -> {
                    RoleModel newRole = session.roles().getRoleById(session.getContext().getRealm(), role);
                    
                    if (newRole != null && !existingRoles.contains(newRole.getId())) {
                        existingUser.grantRole(newRole);
                    }
                });
            } 

            return Cors.add(request, Response
                .ok(this.toUserDetail(existingUser,
                    existingUser.getRealmRoleMappingsStream()
                        .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                        .collect(Collectors.toList())
                ))
            ).auth().allowAllOrigins().build();    
        } else if (existingUser == null) {

            if (!(userHasClaim("right", "identity.user.add") || userHasClaim("right", "tenant.user.add"))) {
                throw new ForbiddenException();
            }

            UserModel newUser = session.users().addUser(session.getContext().getRealm(), user.getId(), user.getUserName(), true, true);
        
            newUser.setEmail(user.getEmail());
            newUser.setEmailVerified(true);
            newUser.setEnabled(user.getEnabled());

            foldedClaims.forEach((key, value) -> {
                newUser.setAttribute(key, value);
            });

            if (user.getUserRoles() != null) {
                user.getUserRoles().forEach(role -> {
                    RoleModel newRole = session.roles().getRoleById(session.getContext().getRealm(), role.getRoleId());
                    newUser.grantRole(newRole);
                });
            } 

            return Cors.add(request, Response
                .ok(this.toUserDetail(newUser,
                    newUser.getRealmRoleMappingsStream()
                        .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                        .collect(Collectors.toList())
                ))
            ).auth().allowAllOrigins().build();   
        }

        return Cors.add(request, Response
            .status(Status.NOT_FOUND)            
        ).auth().allowAllOrigins().allowAllOrigins().build();
    }

    @DELETE
    @Path("remove/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    @NoCache
    @Encoded
    public Response removeUser(
        @PathParam("id") String id) {

        String tenant = assertUserHasTenant();
        
        if (!(userHasClaim("right", "identity.user.delete") || userHasClaim("right", "tenant.user.delete"))) {
            throw new ForbiddenException();
        }

        HttpRequest request = session.getContext().getHttpRequest();

        UserModel existingUser = session.users().getUserById(session.getContext().getRealm(), id);

        if (existingUser != null && existingUser.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant)) {
            
            session.users().removeUser(session.getContext().getRealm(), existingUser);

            return Cors.add(request, Response
                .ok(this.toUserDetail(existingUser,
                    existingUser.getRealmRoleMappingsStream()
                        .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                        .collect(Collectors.toList())
                ))
            ).auth().allowAllOrigins().build();    
        }

        return Cors.add(request, Response
            .status(Status.NOT_FOUND)            
        ).auth().allowAllOrigins().build();
    }

    @GET
    @Path("selectlist")
    @NoCache
    @Produces({MediaType.APPLICATION_JSON})
    @Encoded
    public Response getSelect() {
        String tenant = assertUserHasTenant();

        if (!(userHasClaim("right", "identity.user.view") || userHasClaim("right", "tenant.user.view"))) {
            throw new ForbiddenException();
        }

        HttpRequest request = session.getContext().getHttpRequest();

        return Cors.add(request, Response
            .ok(session.users().searchForUserStream(session.getContext().getRealm(), "")
                .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                .map(e -> new UserSelectlistEntry(e.getId(), e.getUsername()))
                .collect(Collectors.toList()))
            ).auth().allowAllOrigins().build();
    }

    @GET
    @Path("selectbyid/{id}")
    @NoCache
    @Produces({MediaType.APPLICATION_JSON})
    @Encoded
    public Response getSelectById(
        @PathParam("id") String id) {
        
        String tenant = assertUserHasTenant();

        if (!(userHasClaim("right", "identity.user.view") || userHasClaim("right", "tenant.user.view"))) {
            throw new ForbiddenException();
        }

        HttpRequest request = session.getContext().getHttpRequest();

        UserModel user = session.users().getUserById(session.getContext().getRealm(), id);

        if (user != null && user.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant)) {
            return Cors.add(request, Response
                .ok(new UserSelectlistEntry(user.getId(), user.getUsername()))
            ).auth().allowAllOrigins().build();    
        }

        return Cors.add(request, Response
            .status(Status.NOT_FOUND)            
        ).auth().allowAllOrigins().build();
    }

    @POST
    @Path("tenant")
    @NoCache
    @Consumes(MediaType.APPLICATION_JSON)
    @Encoded
    public Response gotoTenant(
        @QueryParam("tenant") String targetTenant) {

        HttpRequest request = session.getContext().getHttpRequest();

        String tenant = assertUserHasTenant();
        String user = assertAuthenticatedUser();

        UserModel existingUser = session.users().getUserById(session.getContext().getRealm(), user);

        if (existingUser != null 
            && existingUser.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant)
            && existingUser.getAttributes().getOrDefault("allowed_tenant", new ArrayList<String>()).contains(targetTenant)) {
            
            existingUser.setAttribute("tenant", List.of(targetTenant));

            return Cors.add(request, 
                Response.ok(this.toUserDetail(existingUser,
                    existingUser.getRealmRoleMappingsStream()
                        .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(targetTenant))
                        .collect(Collectors.toList())
                ))
            ).auth().allowAllOrigins().build();    
        } 
        
        return Cors.add(request, Response
            .status(Status.NOT_FOUND)            
        ).auth().allowAllOrigins().allowAllOrigins().build();
    }

    private String assertAuthenticatedUser() {
        if (this.auth == null || this.auth.getToken() == null) {
            throw new NotAuthorizedException("Bearer");
        }

        return this.auth.getToken().getSubject();
    }

    private String assertUserHasTenant() {

        assertAuthenticatedUser();

        String tenant = (String)this.auth.getToken().getOtherClaims().getOrDefault("tenant", null);

        if (StringUtils.isBlank(tenant)) {
            throw new ForbiddenException();
        }

        return tenant;
    }

    private boolean userHasClaim(String claimType, String claimValue) {

        assert StringUtils.isNotBlank(claimType);
        assert StringUtils.isNotBlank(claimValue); 

        assertAuthenticatedUser();

        Object claimValues = this.auth.getToken().getOtherClaims().getOrDefault(claimType, null);

        boolean isList = claimValues instanceof List<?>;
        boolean hasClaim = isList ? ((List<?>)claimValues).contains(claimValue) : claimValue.equals(claimValues);

        return hasClaim;
    }

    private User toUserDetail(UserModel um, List<RoleModel> assignedRoles) {

        List<UserClaim> claims = new ArrayList<UserClaim>();

        um.getAttributes().entrySet().forEach(entry -> {
            if (entry.getKey() != "tenant") {
                entry.getValue().forEach(value -> claims.add(new UserClaim(null, um.getId(), entry.getKey(), value)));
            }
        });

        List<UserRole> roles = assignedRoles.stream().map(ar -> new UserRole(um.getId(), ar.getId())).collect(Collectors.toList());

        String roleSummary = assignedRoles.stream().map(role -> role.getName()).collect(Collectors.joining(", "));

        return new User(um.getId(), um.getUsername(), um.getEmail(), um.getFirstName(), um.getLastName(), um.isEnabled(), claims, roles, roleSummary);
    }
}
