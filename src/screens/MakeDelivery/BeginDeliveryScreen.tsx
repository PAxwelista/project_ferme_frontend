import { useCallback, useState } from "react";
import { useFetch, useFetchWithGroupId } from "../../hooks";
import { Screen, Loading, Error, Button } from "../../components";
import { Text, StyleSheet, ScrollView } from "react-native";
import { Order, MakeDeliveryStackParamList } from "../../types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiUrl } from "../../config";
import { useDelivery } from "../../context/orderContext";
import { useFocusEffect } from "@react-navigation/native";

type Props = NativeStackScreenProps<MakeDeliveryStackParamList, "BeginDelivery">;

function BeginDeliveryScreen({ navigation }: Props) {
    const fetchWithGroupId = useFetchWithGroupId();
    const { data, isLoading, error, refresh } = useFetch(`${apiUrl}/orders/allAreas`);

    const [errorMessage, setErrorMessage] = useState<string>("");

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh])
    );

    const delivery = useDelivery();

    const handleStartDelivery = async (area: string) => {
        const actualDeliveryResponse = await fetchWithGroupId(`${apiUrl}/deliveries/actualDelivery`);
        const actualDelivery = await actualDeliveryResponse.json();

        if (actualDelivery.result) {
            delivery?.setDelivery(actualDelivery.data);
        } else {
            const orderResponse = await fetchWithGroupId(`${apiUrl}/orders?state=pending&area=${area}`);
            const orders = await orderResponse.json();

            setErrorMessage("");

            if (!orders) {
                setErrorMessage("Problème de connexion");
                return;
            }

            if (orders.orders.length === 0) {
                setErrorMessage("Il n’y a aucune commande à traiter dans cette zone.");
                return;
            }

            const ordersID = orders.orders.map((order: Order) => order._id);

            const stateChangeResponse = await fetchWithGroupId(`${apiUrl}/orders/state`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ordersID,
                    newState: "processing",
                }),
            });

            const deliveriesResponse = await fetchWithGroupId(`${apiUrl}/deliveries`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ordersID,
                }),
            });

            const deliveryData = await deliveriesResponse.json();

            await fetchWithGroupId(`${apiUrl}/deliveries/state`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    deliveryID: deliveryData.data._id,
                    newState: "processing",
                }),
            });

            const stateChange = await stateChangeResponse.json();

            delivery?.setDelivery(deliveryData.data);
        }

        navigation.navigate("PrepareDelivery");
    };

    const Areas = data?.areas.map((area: string) => (
        <Button
            key={area}
            title={area}
            onPress={() => handleStartDelivery(area)}
            isListMember
        />
    ));

    if (isLoading) return <Loading />;

    if (error) return <Error err={error} />;

    return (
        <Screen title="Départ livraison">
            <ScrollView>
                {Areas}
                {errorMessage && <Text>{errorMessage}</Text>}
            </ScrollView>
        </Screen>
    );
}

export {BeginDeliveryScreen}

const styles = StyleSheet.create({
    area: {
        padding: 20,
        margin: 10,
        borderRadius: 10,
        backgroundColor: "lightgrey",
    },
});
