import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Card,
  Form,
  Row,
  Col,
  Pagination,
  Container,
  Badge,
} from "react-bootstrap";

const ITEMS_PER_PAGE = 6;

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("Pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await fetch("https://api.ravandurustores.com/api/orders");
        if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`);
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching orders:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Pagination calcs
  const totalPages = Math.max(1, Math.ceil(orders.length / ITEMS_PER_PAGE));
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem);

  // Ensure currentPage never exceeds totalPages after data loads/changes
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleEditClick = (order) => {
    setSelectedOrder(order);
    setSelectedStatus(order?.status || "Pending");
  };

  const handleSaveChanges = async () => {
    if (!selectedOrder?._id) return;

    try {
      const res = await fetch(
        `https://api.ravandurustores.com/api/orders/${selectedOrder._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: selectedStatus }),
        }
      );

      if (!res.ok) {
        console.error("❌ Failed to update order status.");
        return;
      }

      const updatedOrder = await res.json();

      // Update list
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
      );

      alert("✅ Order status updated successfully!");
      setSelectedOrder(null);
    } catch (err) {
      console.error("🚨 Error updating order:", err.message);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN") : "-";

  return (
    <Container className="py-4">
      {!selectedOrder ? (
        <>
          <h3 className="text-center mb-4">Orders Management</h3>

          {loading ? (
            <p className="text-center">Loading…</p>
          ) : (
            <>
              <Table bordered hover responsive className="shadow-sm" style={{ width: "100%" }}>
                <thead className="bg-light">
                  <tr className="text-center">
                    <th>Sl.No</th>
                    <th>Customer</th>
                    <th>Amount (₹)</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center">No orders found.</td>
                    </tr>
                  ) : (
                    currentOrders.map((order, idx) => {
                      const fullName = `${order.address?.firstName || ""} ${order.address?.lastName || ""}`.trim() || "-";
                      const amount = order.amount ? Number(order.amount).toFixed(2) : "0.00";
                      return (
                        <tr key={order._id} className="text-center">
                          <td>{indexOfFirstItem + idx + 1}</td>
                          <td>{fullName}</td>
                          <td>₹{amount}</td>
                          <td>{order.paymentMode || "-"}</td>
                          <td>
                            <Badge bg={
                              order.status === "Delivered" ? "success" :
                              order.status === "Ready for Dispatch" ? "warning" :
                              "secondary"
                            }>
                              {order.status || "Pending"}
                            </Badge>
                          </td>
                          <td>{formatDate(order.createdAt)}</td>
                          <td>
                            <Button
                              variant="outline-dark"
                              size="sm"
                              onClick={() => handleEditClick(order)}
                              className="rounded-pill px-3"
                            >
                              ✏️ Edit
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>

              <Pagination className="justify-content-center">
                <Pagination.First
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                />
                {Array.from({ length: totalPages }, (_, i) => (
                  <Pagination.Item
                    key={i + 1}
                    active={i + 1 === currentPage}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </>
          )}
        </>
      ) : (
        <>
          <Button
            variant="secondary"
            onClick={() => setSelectedOrder(null)}
            className="mb-3 rounded-pill px-3"
          >
            ← Back
          </Button>

          <h4 className="mb-3">Order Details</h4>

          <Card className="shadow-lg border-0 rounded p-3 mb-3" style={{ maxWidth: 560 }}>
            <Card.Body>
              <h6 className="mb-2">
                {`${selectedOrder.address?.firstName || ""} ${selectedOrder.address?.lastName || ""}`.trim() || "Customer"}
              </h6>
              <p className="mb-1"><strong>Total:</strong> ₹{selectedOrder.amount ? Number(selectedOrder.amount).toFixed(2) : "0.00"}</p>
              <p className="mb-1"><strong>Payment:</strong> {selectedOrder.paymentMode || "-"}</p>
              <p className="mb-1"><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
              <p className="mb-1"><strong>Address:</strong></p>
              <p className="mb-0">
                {selectedOrder.address ? (
                  <>
                    {selectedOrder.address.address},<br />
                    {selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.pincode}
                  </>
                ) : ("No address available")}
              </p>
            </Card.Body>
          </Card>

          {/* Order-level Status */}
          <Card className="shadow-sm border-0 rounded p-3 mb-4" style={{ maxWidth: 560 }}>
            <Card.Body>
              <Form.Group>
                <Form.Label><strong>Order Status</strong></Form.Label>
                <Form.Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Ready for Dispatch">Ready for Dispatch</option>
                  <option value="Delivered">Delivered</option>
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>

          {/* Items list */}
          <h5 className="mb-2">🛒 Items</h5>
          <Row className="g-3">
            {(selectedOrder.items || []).map((it) => (
              <Col md={6} lg={4} key={it._id}>
                <Card className="border-0 rounded shadow-sm h-100">
                  <Card.Body className="d-flex flex-column">
                    <Card.Title className="text-center" style={{ fontSize: 16 }}>
                      {it.productName || "Item"}
                    </Card.Title>
                    <Card.Text className="text-muted text-center mb-2">
                      ₹{it.price ?? "-"} &nbsp;|&nbsp; Qty: {it.quantity ?? "-"}
                    </Card.Text>
                    {it.productImage ? (
                      <div className="text-center">
                        <img
                          src={it.productImage}
                          alt={it.productName}
                          style={{ maxWidth: "100%", height: 120, objectFit: "cover", borderRadius: 8 }}
                        />
                      </div>
                    ) : null}
                    {/* If you later add per-item status, render a small badge here */}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <Button
            onClick={handleSaveChanges}
            variant="success"
            className="rounded-pill px-4 mt-3"
          >
            💾 Save Changes
          </Button>
        </>
      )}
    </Container>
  );
};

export default OrdersPage;
