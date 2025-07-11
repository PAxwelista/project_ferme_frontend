import { StyleSheet, View, Modal, Text, TouchableOpacity, ScrollView } from "react-native";
import { Loading, Screen, Button, Input, Error } from "../../components";
import { useFetch, useFetchWithGroupId, useFormInput } from "../../hooks";
import { apiUrl } from "../../config";
import { AvailableProduct } from "../../types";
import { useState } from "react";
import { CustomModal } from "../../components/CustomModal";
import { AddNewProductForm } from "./Components/AddNewProductForm";

function ProductsScreen() {
    const { values, handleChangeValue, reset } = useFormInput({ name: "", price: "" });
    const [showModal, setShowModal] = useState<boolean>(false);
    const fecthWithGroupId = useFetchWithGroupId();
    const [errorMessage, setErrorMessage] = useState<string>("");
    const { data, isLoading, refresh } = useFetch(`${apiUrl}/products`);

    if (isLoading) return <Loading />;

    const handlePressProduct = () => {};

    const handleOpenModal = () => {
        setShowModal(true);
    };
    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleAddNewProduct = async () => {
        if (!values.name || !values.price) return setErrorMessage("Veuillez rentrez toutes les informations");

        try {
            const response = await fecthWithGroupId(`${apiUrl}/products`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            const json = await response.json();

            if (json.result) {
                reset();
                setShowModal(false);
                refresh();
            }
        } catch (error) {
            setErrorMessage(`Erreur de connexion : ${error}`);
        }
    };

    const products = data?.products.map((v: AvailableProduct) => (
        <Button
            key={v._id}
            title={`${v.name} : ${v.price ? v.price + " euros" : "prix non définie"}`}
            onPress={handlePressProduct}
            isListMember
        />
    ));

    return (
        <Screen
            title="Produits"
            hasHeaderBar
        >
            <View style={styles.container}>
                <ScrollView>{products}</ScrollView>
                {errorMessage && <Error err={errorMessage} />}
                <Button
                    title="Nouveau produit"
                    onPress={handleOpenModal}
                />
            </View>
            <CustomModal
                visible={showModal}
                handleCloseModal={handleCloseModal}
            >
                <AddNewProductForm
                    values={values}
                    handleChangeValue={handleChangeValue}
                    handleAddNewProduct={handleAddNewProduct}
                />
            </CustomModal>
        </Screen>
    );
}

export { ProductsScreen };

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "space-around",
    },
    modal: {
        flex: 1,
        marginHorizontal: 20,
        marginVertical: 100,
        padding: 30,
        borderRadius: 20,
        backgroundColor: "white",
        borderWidth: 1,
    },

    closeBtnContainer: {
        alignItems: "flex-end",
    },
    closeBtn: {
        backgroundColor: "lightgrey",
        justifyContent: "center",
        alignItems: "center",
        height: 40,
        width: 40,
        borderRadius: "50%",
    },
    textCloseBtn: {
        fontSize: 20,
        fontWeight: "bold",
    },
});
