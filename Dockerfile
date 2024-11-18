
FROM registry.access.redhat.com/ubi9 AS ubi-micro-build
RUN mkdir -p /mnt/rootfs
RUN dnf install --installroot /mnt/rootfs tar gzip git --releasever 9 --setopt install_weak_deps=false --nodocs -y && \
    dnf --installroot /mnt/rootfs clean all && \
    rpm --root /mnt/rootfs -e --nodeps setup


FROM maven:3-openjdk-18 as themebuilder
COPY ballware-theme/src /home/app/src
COPY ballware-theme/pom.xml /home/app
RUN mvn -f /home/app/pom.xml clean package

FROM maven:3-openjdk-18 as mapperbuilder
COPY token-mapper/src /home/app/src
COPY token-mapper/pom.xml /home/app
RUN mvn -f /home/app/pom.xml clean package

FROM maven:3-openjdk-18 as apibuilder
COPY user-role-api/src /home/app/src
COPY user-role-api/pom.xml /home/app
RUN mvn -f /home/app/pom.xml clean package

FROM quay.io/keycloak/keycloak:24.0 as builder
COPY --from=themebuilder  /home/app/target/*.jar /opt/keycloak/providers
COPY --from=mapperbuilder  /home/app/target/*.jar /opt/keycloak/providers
COPY --from=apibuilder  /home/app/target/*.jar /opt/keycloak/providers
COPY ./import /opt/keycloak/data/import

# Enable health and metrics support
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

# Configure a database vendor
ENV KC_DB=postgres

WORKDIR /opt/keycloak
# for demonstration purposes only, please make sure to use proper certificates in production instead
# RUN keytool -genkeypair -storepass password -storetype PKCS12 -keyalg RSA -keysize 2048 -dname "CN=server" -alias server -ext "SAN:c=DNS:localhost,IP:127.0.0.1" -keystore conf/server.keystore
RUN /opt/keycloak/bin/kc.sh build --transaction-xa-enabled=false

FROM quay.io/keycloak/keycloak:24.0
COPY --from=ubi-micro-build /mnt/rootfs /
COPY --from=builder /opt/keycloak/ /opt/keycloak/

USER root 
USER 1000

# change these values to point to a running postgres instance
#ENV KC_DB_URL=<DBURL>
#ENV KC_DB_USERNAME=<DBUSERNAME>
#ENV KC_DB_PASSWORD=<DBPASSWORD>
#ENV KC_HOSTNAME=localhost
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]