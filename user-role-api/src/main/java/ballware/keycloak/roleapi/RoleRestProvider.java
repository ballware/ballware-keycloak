package ballware.keycloak.roleapi;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.Encoded;
import javax.ws.rs.ForbiddenException;
import javax.ws.rs.GET;
import javax.ws.rs.NotAuthorizedException;
import javax.ws.rs.OPTIONS;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.apache.commons.lang.StringUtils;
import org.jboss.resteasy.annotations.cache.NoCache;
import org.jboss.resteasy.spi.HttpRequest;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RoleModel;
import org.keycloak.models.UserModel;
import org.keycloak.services.managers.AppAuthManager;
import org.keycloak.services.managers.AuthenticationManager.AuthResult;
import org.keycloak.services.resource.RealmResourceProvider;
import org.keycloak.services.resources.Cors;
import org.keycloak.utils.MediaType;

import ballware.keycloak.roleapi.model.Role;
import ballware.keycloak.roleapi.model.RoleClaim;
import ballware.keycloak.roleapi.model.RoleSelectlistEntry;
import ballware.keycloak.roleapi.model.RoleUser;

public class RoleRestProvider implements RealmResourceProvider {
    private final KeycloakSession session;
    private final AuthResult auth;
    
    public RoleRestProvider(KeycloakSession session) {
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
		HttpRequest request = session.getContext().getContextObject(HttpRequest.class);
		return Cors.add(request, Response.ok()).auth().allowedMethods("OPTIONS", "GET", "POST", "DELETE").preflight().build();
	}

    @GET
    @Path("all")
    @NoCache
    @Produces({MediaType.APPLICATION_JSON})
    @Encoded
    public Response getAllRoles(String identifier) {
        
        String tenant = assertUserHasTenant();
        assertUserHasClaim("right", "identity.role.view");

        HttpRequest request = session.getContext().getContextObject(HttpRequest.class);

        return Cors.add(request, Response
            .ok(session.roles().searchForRolesStream(session.getContext().getRealm(), "", null, null)
                .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                .map(e -> toRoleDetail(e, 
                    session.users().getRoleMembersStream(session.getContext().getRealm(), e)
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
    public Response getRoleById(
        @QueryParam("identifier") String identifier, 
        @QueryParam("id") String id) {
        
        String tenant = assertUserHasTenant();
        assertUserHasClaim("right", "identity.role.view");

        HttpRequest request = session.getContext().getContextObject(HttpRequest.class);

        RoleModel role = session.roles().getRoleById(session.getContext().getRealm(), id);

        if (role != null && role.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant)) {
            return Cors.add(request, Response
                .ok(this.toRoleDetail(role,
                    session.users().getRoleMembersStream(session.getContext().getRealm(), role)
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
    public Response getNewRole(String identifier) {
        
        assertUserHasTenant();
        assertUserHasClaim("right", "identity.role.add");
        
        HttpRequest request = session.getContext().getContextObject(HttpRequest.class);

        return Cors.add(request, Response
            .ok(new Role(UUID.randomUUID().toString(), "", null, null, null))
            ).auth().allowAllOrigins().build();
    }

    @POST
    @Path("save")
    @NoCache
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Encoded
    public Response saveRole(
        @QueryParam("identifier") String identifier, Role role) {

        String tenant = assertUserHasTenant();
        assertAuthenticatedUser();

        Map<String, List<String>> foldedClaims = new HashMap<String, List<String>>();

        if (role.getRoleClaims() != null) {
            role.getRoleClaims().forEach(cl -> {
                if (!"tenant".equals(cl.getClaimType())) {
                    if (!foldedClaims.containsKey(cl.getClaimType())) {
                        foldedClaims.put(cl.getClaimType(), new ArrayList<String>());
                    }

                    foldedClaims.get(cl.getClaimType()).add(cl.getClaimValue());
                }
            });
        }

        foldedClaims.put("tenant", Arrays.asList(new String[] { tenant }));
        
        HttpRequest request = session.getContext().getContextObject(HttpRequest.class);

        RoleModel existingRole = session.roles().getRoleById(session.getContext().getRealm(), role.getId());

        if (existingRole != null && existingRole.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant)) {
            
            assertUserHasClaim("right", "identity.role.edit");

            existingRole.setName(role.getDisplayName());

            foldedClaims.forEach((key, value) -> {
                existingRole.setAttribute(key, value);
            });

            if (role.getRoleUsers() != null) {
                List<String> newUsers = role.getRoleUsers().stream().map(r -> r.getUserId()).collect(Collectors.toList());

                List<String> existingUsers = session.users().getRoleMembersStream(session.getContext().getRealm(), existingRole)
                    .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                    .map(r -> r.getId())
                    .collect(Collectors.toList());

                existingUsers.forEach(user -> {
                    if (!newUsers.contains(user)) {
                        UserModel existingUser = session.users().getUserById(session.getContext().getRealm(), user);
                    
                        existingUser.deleteRoleMapping(existingRole);
                    }
                });

                newUsers.forEach(user -> {
                    UserModel newUser = session.users().getUserById(session.getContext().getRealm(), user);
                    
                    if (newUser != null && !existingUsers.contains(newUser.getId())) {
                        newUser.grantRole(existingRole);
                    }
                });
            } 

            return Cors.add(request, Response
                .ok(this.toRoleDetail(existingRole,
                    session.users().getRoleMembersStream(session.getContext().getRealm(), existingRole)
                        .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                        .collect(Collectors.toList())
                ))
            ).auth().allowAllOrigins().build();    
        } else if (existingRole == null) {
            assertUserHasClaim("right", "identity.role.add");

            RoleModel newRole = session.roles().addRealmRole(session.getContext().getRealm(), role.getDisplayName());
        
            foldedClaims.forEach((key, value) -> {
                newRole.setAttribute(key, value);
            });

            if (role.getRoleUsers() != null) {
                role.getRoleUsers().forEach(user -> {
                    UserModel newUser = session.users().getUserById(session.getContext().getRealm(), user.getUserId());
                    newUser.grantRole(newRole);
                });
            } 

            return Cors.add(request, Response
                .ok(this.toRoleDetail(newRole,
                    session.users().getRoleMembersStream(session.getContext().getRealm(), newRole)
                        .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                        .collect(Collectors.toList())
                ))
            ).auth().allowAllOrigins().build();   
        }

        return Cors.add(request, Response
            .status(Status.NOT_FOUND)            
        ).auth().allowAllOrigins().build();
    }

    @DELETE
    @Path("remove/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    @NoCache
    @Encoded
    public Response removeRole(
        @PathParam("id") String id) {

        String tenant = assertUserHasTenant();
        assertUserHasClaim("right", "identity.role.delete");

        HttpRequest request = session.getContext().getContextObject(HttpRequest.class);

        RoleModel existingRole = session.roles().getRoleById(session.getContext().getRealm(), id);

        if (existingRole != null && existingRole.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant)) {
            
            session.roles().removeRole(existingRole);

            return Cors.add(request, Response
                .ok(this.toRoleDetail(existingRole,
                    session.users().getRoleMembersStream(session.getContext().getRealm(), existingRole)
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
        assertUserHasClaim("right", "identity.role.view");

        HttpRequest request = session.getContext().getContextObject(HttpRequest.class);

        return Cors.add(request, Response
            .ok(session.roles().searchForRolesStream(session.getContext().getRealm(), "", null, null)
                .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                .map(e -> new RoleSelectlistEntry(e.getId(), e.getName()))
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
        assertUserHasClaim("right", "identity.role.view");

        HttpRequest request = session.getContext().getContextObject(HttpRequest.class);

        RoleModel role = session.roles().getRoleById(session.getContext().getRealm(), id);

        if (role != null && role.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant)) {
            return Cors.add(request, Response
                .ok(new RoleSelectlistEntry(role.getId(), role.getName()))
            ).auth().allowAllOrigins().build();    
        }

        return Cors.add(request, Response
            .status(Status.NOT_FOUND)            
        ).auth().allowAllOrigins().build();
    }

    private Role toRoleDetail(RoleModel rm, List<UserModel> assignedUser) {

        List<RoleClaim> claims = new ArrayList<RoleClaim>();

        rm.getAttributes().entrySet().forEach(entry -> {
            if (entry.getKey() != "tenant") {
                entry.getValue().forEach(value -> claims.add(new RoleClaim(null, rm.getId(), entry.getKey(), value)));
            }
        });

        List<RoleUser> users = assignedUser.stream().map(au -> new RoleUser(rm.getId(), au.getId())).collect(Collectors.toList());

        String userSummary = assignedUser.stream().map(user -> user.getUsername()).collect(Collectors.joining(", "));

        return new Role(
            rm.getId(), 
            rm.getName(),
            claims,
            users,
            userSummary
        );
    } 

    private void assertAuthenticatedUser() {
        if (this.auth == null || this.auth.getToken() == null) {
            throw new NotAuthorizedException("Bearer");
        }
    }

    private String assertUserHasTenant() {

        assertAuthenticatedUser();

        String tenant = (String)this.auth.getToken().getOtherClaims().getOrDefault("tenant", null);

        if (StringUtils.isBlank(tenant)) {
            throw new ForbiddenException();
        }

        return tenant;
    }

    private void assertUserHasClaim(String claimType, String claimValue) {

        assert StringUtils.isNotBlank(claimType);
        assert StringUtils.isNotBlank(claimValue); 

        assertAuthenticatedUser();

        Object claimValues = this.auth.getToken().getOtherClaims().getOrDefault(claimType, null);

        boolean isList = claimValues instanceof List<?>;
        boolean hasClaim = isList ? ((List<?>)claimValues).contains(claimValue) : claimValue.equals(claimValues);

        if (!hasClaim) {
            throw new ForbiddenException();
        }
    }
}
