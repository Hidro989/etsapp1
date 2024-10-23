import React, { useState, useCallback, useEffect } from "react";
import '@shopify/polaris/build/esm/styles.css';
import { Box, Page, Text, TextField, Card, BlockStack, Button } from "@shopify/polaris";
import {contact_logo} from '../public/index.js'

export const Login = () => {
    const [shopDomain, setShopDomain] = useState('');
    const [errorText, setErrorText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const isValidShopDomain = (value) => {
        const regex = /^(https?:\/\/)?([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,5}(\/.*)?$/i;
        return regex.test(value);
    };
    const removeProtocol = (url) => {
        if (typeof url !== 'string') {
            return '';
        }
        return url.replace(/^https?:\/\//, '');
    }

    const validateShopDomain = (value) => {
        const trimmedValue = value.trim();
        if (!trimmedValue) {
            return 'Please enter your Shopify domain!';
        } else if (!isValidShopDomain(trimmedValue)) {
            return 'Your Shopify domain is not valid!';
        } else {
            return '';
        }
    };

    const handleChange = (value) => {
        const trimmedValue = value.trim();
        setShopDomain(trimmedValue);
        setErrorText(validateShopDomain(trimmedValue));
    };

    const handleAutoCompleteDomain = useCallback(() => {
        let domain = shopDomain;
        if (shopDomain.length && !shopDomain.endsWith('.myshopify.com') && !shopDomain.includes('.com') && !shopDomain.includes('.')) {
            domain += '.myshopify.com';
        }
        setShopDomain(domain);
        setErrorText(validateShopDomain(domain));
    }, [shopDomain])

    const handleSubmit = useCallback(async () => {
        const errorText = validateShopDomain(shopDomain);
        setErrorText(errorText);
        if (!errorText) {
            setIsLoading(true);
            window.location.href = `${import.meta.env.VITE_APP_URL}/etsapp1/api/shopify/auth?shop=${removeProtocol(shopDomain)}`;
            setTimeout(() => {
                setIsLoading(false);
            }, 6000);
        }
    }, [shopDomain]);

    return (
        <Page>
            <BlockStack inlineAlign="center">
                <div style={{ width: "500px" }}>
                    <Card>
                        <Box paddingInline={300}>
                            <img width="100px" height="100px" src={contact_logo} alt="Contact form ultimate" />
                            <Text as="h2" variant="headingXl">Log in</Text>
                            <Text as="p" >Continute to UpForm  - Contact Form Builder</Text>
                        </Box>
                        <Box padding={300}>
                            <TextField
                                label="Store domain"
                                value={shopDomain}
                                onChange={handleChange}
                                onBlur={handleAutoCompleteDomain}
                                placeholder="your_domain.myshopify.com"
                                error={errorText}
                            />
                            <br />
                            <Button variant="primary" fullWidth size="large" loading={isLoading} onClick={handleSubmit}>Submit</Button>
                        </Box>
                    </Card>
                </div>
            </BlockStack>
        </Page>
    );
}