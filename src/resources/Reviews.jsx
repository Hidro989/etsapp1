import React, { useState, useEffect, useCallback } from "react";
import {
  Page,
  Card,
  DataTable,
  Badge,
  Button,
  Modal,
  TextContainer,
} from "@shopify/polaris";

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_URL}/etsapp1/api/shopify/reviews`
      );

      const data = await response.json();
      if (data.status === "success") {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const handleApprove = async (reviewId) => {

    try {
      await fetch(
        `${import.meta.env.VITE_APP_URL}/etsapp1/api/shopify/reviews/approve?reviewId=${reviewId}`);
      fetchReviews();
    } catch (error) {
      console.error("Error approving review:", error);
    }
  };

  const handleDelete = async (reviewId) => {
    try {
      await fetch(`${import.meta.env.VITE_APP_URL}/etsapp1/api/deleteRating?reviewId=${reviewId}`);
      setShowDeleteModal(false);
      fetchReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const rows = reviews.map((review) => [
    review.customerName,
    review.customerEmail,
    review.productTitle,
    review.rating,
    review.message,
    <Badge
      status={review.ratingStatus === "approved" ? "success" : "attention"}
    >
      {review.ratingStatus}
    </Badge>,
    <div>
      {review.ratingStatus === "pending" && (
        <Button onClick={() => handleApprove(review._id)}>Approve</Button>
      )}
      <Button
        destructive
        onClick={() => {
          setSelectedReview(review);
          setShowDeleteModal(true);
        }}
      >
        Delete
      </Button>
    </div>,
  ]);

  return (
    <Page title="Review Management">
      <Card>
        <DataTable
          columnContentTypes={[
            "text",
            "text",
            "text",
            "numeric",
            "text",
            "text",
            "text",
          ]}
          headings={[
            "Customer",
            "Email",
            "Product",
            "Rating",
            "Message",
            "Status",
            "Actions",
          ]}
          rows={rows}
        />
      </Card>

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Review"
        primaryAction={{
          content: "Delete",
          onAction: () => handleDelete(selectedReview._id),
          destructive: true,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setShowDeleteModal(false),
          },
        ]}
      >
        <Modal.Section>
          <TextContainer>
            <p>Are you sure you want to delete this review?</p>
          </TextContainer>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
