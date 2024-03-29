package ballware.keycloak.tokenmapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.keycloak.models.ClientSessionContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.ProtocolMapperModel;
import org.keycloak.models.RoleModel;
import org.keycloak.models.UserSessionModel;
import org.keycloak.protocol.ProtocolMapperUtils;
import org.keycloak.protocol.oidc.mappers.AbstractOIDCProtocolMapper;
import org.keycloak.protocol.oidc.mappers.OIDCAccessTokenMapper;
import org.keycloak.protocol.oidc.mappers.OIDCAttributeMapperHelper;
import org.keycloak.protocol.oidc.mappers.OIDCIDTokenMapper;
import org.keycloak.protocol.oidc.mappers.UserInfoTokenMapper;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.representations.AccessToken;
import org.keycloak.representations.IDToken;
import org.keycloak.utils.RoleResolveUtil;
import org.keycloak.utils.StringUtil;

public class ProtocolMapper extends AbstractOIDCProtocolMapper implements OIDCAccessTokenMapper, OIDCIDTokenMapper, UserInfoTokenMapper {
    /*
     * A config which keycloak uses to display a generic dialog to configure the token.
     */
    private static final List<ProviderConfigProperty> configProperties = new ArrayList<>();

    public static final String ROLE_ATTRIBUTE = "role.attribute";
    public static final String INSERT_USER_ATTRIBUTE_VALUES = "insertuserattributevalues";

    /*
     * The ID of the token mapper. Is public, because we need this id in our data-setup project to
     * configure the protocol mapper in keycloak.
     */
    public static final String PROVIDER_ID = "ballware-token-mapper";

    private static final Pattern USER_ATTRIBUTE_PATTERN = Pattern.compile("\\{\\{([a-zA-Z0-9-_]*)\\}\\}");

    static {
        ProviderConfigProperty attributeNameProperty = new ProviderConfigProperty();
        attributeNameProperty.setName(ROLE_ATTRIBUTE);
        attributeNameProperty.setLabel("Role attribute");
        attributeNameProperty.setHelpText("Name of realm role attribute to map to token");
        attributeNameProperty.setType(ProviderConfigProperty.STRING_TYPE);
        configProperties.add(attributeNameProperty);

        // The builtin protocol mapper let the user define under which claim name (key)
        // the protocol mapper writes its value. To display this option in the generic dialog
        // in keycloak, execute the following method.
        OIDCAttributeMapperHelper.addTokenClaimNameConfig(configProperties);

        // The builtin protocol mapper let the user define for which tokens the protocol mapper
        // is executed (access token, id token, user info). To add the config options for the different types
        // to the dialog execute the following method. Note that the following method uses the interfaces
        // this token mapper implements to decide which options to add to the config. So if this token
        // mapper should never be available for some sort of options, e.g. like the id token, just don't
        // implement the corresponding interface.
        OIDCAttributeMapperHelper.addIncludeInTokensConfig(configProperties, ProtocolMapper.class);        

        ProviderConfigProperty multivalueProperty = new ProviderConfigProperty();
        multivalueProperty.setName(ProtocolMapperUtils.MULTIVALUED);
        multivalueProperty.setLabel(ProtocolMapperUtils.MULTIVALUED_LABEL);
        multivalueProperty.setHelpText(ProtocolMapperUtils.MULTIVALUED_HELP_TEXT);
        multivalueProperty.setType(ProviderConfigProperty.BOOLEAN_TYPE);
        configProperties.add(multivalueProperty);

        ProviderConfigProperty insertUserAttributesValuesProperty = new ProviderConfigProperty();
        insertUserAttributesValuesProperty.setName(INSERT_USER_ATTRIBUTE_VALUES);
        insertUserAttributesValuesProperty.setLabel("Insert user attribute values");
        insertUserAttributesValuesProperty.setHelpText("Insert user attribute values in brackets {{userattribute}}");
        insertUserAttributesValuesProperty.setType(ProviderConfigProperty.BOOLEAN_TYPE);
        configProperties.add(insertUserAttributesValuesProperty);
    }

    @Override
    public String getDisplayCategory() {
        return "Token mapper";
    }

    @Override
    public String getDisplayType() {
        return "ballware role attributes to token mapper";
    }

    @Override
    public String getHelpText() {
        return "Maps application provided attributes in roles to token";
    }

    @Override
    public List<ProviderConfigProperty> getConfigProperties() {
        return configProperties;
    }

    @Override
    public String getId() {
        return PROVIDER_ID;
    }

    @Override
    protected void setClaim(final IDToken token,
                            final ProtocolMapperModel mappingModel,
                            final UserSessionModel userSession,
                            final KeycloakSession keycloakSession,
                            final ClientSessionContext clientSessionCtx) {

        String attributeName = mappingModel.getConfig().get(ROLE_ATTRIBUTE);
        Boolean insertUserAttributeValues = "true".equals(mappingModel.getConfig().get(INSERT_USER_ATTRIBUTE_VALUES));
                                
        // adds our data to the token. Uses the parameters like the claim name which were set by the user
        // when this protocol mapper was configured in keycloak. Note that the parameters which can
        // be configured in keycloak for this protocol mapper were set in the static intializer of this class.
        //
        // Sets a static "Hello world" string, but we could write a dynamic value like a group attribute here too.
        AccessToken.Access access = RoleResolveUtil.getResolvedRealmRoles(keycloakSession, clientSessionCtx, false);

        Optional<String> tenant = userSession.getUser().getAttributeStream("tenant").findFirst();

        if (access != null && tenant.isPresent()) {
            List<String> claimValues = new ArrayList<String>();

            Set<String> roleNames = access.getRoles().stream().collect(Collectors.toSet());

            for (String role : roleNames) {
                RoleModel roleModel = userSession.getRealm().getRole(role);

                if (roleModel.getAttributeStream("tenant").anyMatch(t -> t.equalsIgnoreCase(tenant.get()) || t.equalsIgnoreCase("*"))) {
                    roleModel.getAttributes().forEach((key, values) -> {
                        if (key.equals(attributeName)) {  
                            if (insertUserAttributeValues) {
                                values = values.stream().map(v -> {                                    
                                    Matcher matcher;

                                    while ((matcher = USER_ATTRIBUTE_PATTERN.matcher(v)).find()) {
                                        
                                        String userAttributeName = matcher.group(1);                                        
                                        String userAttributeValue = userSession.getUser().getFirstAttribute(userAttributeName);

                                        if (StringUtil.isNotBlank(userAttributeValue)) {
                                            v = matcher.replaceFirst(userAttributeValue);
                                        } else {
                                            v = matcher.replaceFirst("undefined");
                                        }      
                                    }
                                    
                                    return v;
                                }).collect(Collectors.toList());
                            }   

                            claimValues.addAll(values);
                        }
                    });
                }
            }                


            if (OIDCAttributeMapperHelper.isMultivalued(mappingModel)) {
                OIDCAttributeMapperHelper.mapClaim(token, mappingModel, claimValues);
            } else {
                OIDCAttributeMapperHelper.mapClaim(token, mappingModel, String.join(",", claimValues));
            }
        }
        
    }
}
