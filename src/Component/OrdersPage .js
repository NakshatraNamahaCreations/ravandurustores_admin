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
const API_BASE = "https://api.ravandurustores.com";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("Pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Convert image path into full URL
  const makeImageUrl = (img) => {
    if (!img) return null;
    if (typeof img === "string" && img.startsWith("blob:")) return img;
    if (typeof img === "string" && /^https?:\/\//i.test(img)) return img;
    if (typeof img === "string") {
      return `${API_BASE}/${img.replace(/^\/+/, "")}`;
    }
    return null;
  };

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/orders`);

        if (!res.ok) throw new Error(`Error: ${res.status}`);

        const data = await res.json();

        const sorted = Array.isArray(data)
          ? data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          : [];

        setOrders(sorted);
        setFilteredOrders(sorted);
      } catch (err) {
        console.error("Error fetching orders:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Search filter
  useEffect(() => {
    const search = searchTerm.toLowerCase();

    const result = orders.filter((order) => {
      const name =
        `${order.address?.firstName || ""} ${order.address?.lastName || ""}`
          .toLowerCase()
          .trim();

      const phone =
        (
          order.address?.phone ||
          order.address?.mobile ||
          order.address?.mobileNumber ||
          ""
        ).toString();

      return (
        name.includes(search) ||
        phone.includes(search) ||
        (order.paymentMode || "").toLowerCase().includes(search) ||
        (order.status || "").toLowerCase().includes(search)
      );
    });

    setFilteredOrders(result);
    setCurrentPage(1);
  }, [searchTerm, orders]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  );

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN") : "-";

  const handleEditClick = (order) => {
    setSelectedOrder(order);
    setSelectedStatus(order.status);
  };

  const handleSaveChanges = async () => {
    if (!selectedOrder?._id) return;

    const res = await fetch(`${API_BASE}/api/orders/${selectedOrder._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: selectedStatus }),
    });

    if (!res.ok) {
      alert("Failed to update status");
      return;
    }

    alert("Status updated!");
    setSelectedOrder(null);
  };

  return (
    <Container className="py-4" style={{ marginLeft: "15%" }}>
      {!selectedOrder ? (
        <>
          {/* Orders list */}
          <h3 className="text-center mb-4">Orders Management</h3>

          <input
            type="text"
            placeholder="Search orders..."
            style={{
              padding: "7px 10px",
              width: "300px",
              marginBottom: "15px",
              borderRadius: "5px",
              border: "1px solid #ccc",
              marginLeft: "2%",
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div style={{ overflowX: "auto", width: "100%" }}>
            <Table bordered hover className="shadow-sm" style={{ minWidth: "1000px" }}>
              <thead className="bg-light">
                <tr className="text-center">
                  <th>Sl.No</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {currentOrders.map((order, idx) => {
                  const name =
                    `${order.address?.firstName || ""} ${order.address?.lastName || ""}`.trim();

                  return (
                    <tr key={order._id} className="text-center">
                      <td>{indexOfFirstItem + idx + 1}</td>
                      <td>{name}</td>
                      <td>
                        {order.address?.phone ||
                          order.address?.mobile ||
                          order.address?.mobileNumber ||
                          "-"}
                      </td>
                      <td>₹{Number(order.amount).toFixed(2)}</td>
                      <td>{order.paymentMode}</td>
                      <td>
                        <Badge
                          bg={
                            order.status === "Delivered"
                              ? "success"
                              : order.status === "Ready for Dispatch"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        {order.status !== "Delivered" && (
                          <Button
                            variant="outline-dark"
                            size="sm"
                            className="rounded-pill px-3"
                            onClick={() => handleEditClick(order)}
                          >
                            ✏️ Edit
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          <Pagination className="justify-content-center">
            {Array.from({ length: totalPages }).map((_, i) => (
              <Pagination.Item
                key={i}
                active={i + 1 === currentPage}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Pagination.Item>
            ))}
          </Pagination>
        </>
      ) : (
        <>
          {/* Selected Order Details */}
          <Button
            variant="secondary"
            onClick={() => setSelectedOrder(null)}
            className="mb-3 rounded-pill px-3"
            style={{ marginLeft: "10%" }}
          >
            ← Back
          </Button>

          <h4 style={{ marginLeft: "10%" }}>Order Details</h4>

          <Card className="shadow-lg border-0 rounded p-3 mb-3" style={{ maxWidth: 560, marginLeft: "10%" }}>
            <Card.Body>
              <h6>
                {selectedOrder?.address?.firstName
                  ? `${selectedOrder.address.firstName} ${selectedOrder.address.lastName || ""}`
                  : "No name available"}
              </h6>

              <p><strong>Total:</strong> ₹{selectedOrder?.amount ?? "-"}</p>
              <p><strong>Payment:</strong> {selectedOrder?.paymentMode ?? "-"}</p>
              <p><strong>Date:</strong> {selectedOrder?.createdAt ? formatDate(selectedOrder.createdAt) : "-"}</p>

              <p><strong>Address:</strong></p>

              {selectedOrder?.address ? (
                <p>
                  {selectedOrder.address.address}<br />
                  {selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.pincode}
                </p>
              ) : (
                <p style={{ color: "#666" }}>Address not available</p>
              )}
            </Card.Body>
          </Card>

          {/* Status Update */}
          <Card className="shadow-sm border-0 rounded p-3 mb-4" style={{ maxWidth: 560, marginLeft: "10%" }}>
            <Card.Body>
              <Form.Group>
                <Form.Label><strong>Order Status</strong></Form.Label>
                <Form.Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={selectedStatus === "Delivered"}
                >
                  {selectedStatus === "Delivered" ? (
                    <option value="Delivered">Delivered</option>
                  ) : (
                    <>
                      <option value="Pending">Pending</option>
                      <option value="Ready for Dispatch">Ready for Dispatch</option>
                      <option value="Delivered">Delivered</option>
                    </>
                  )}
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>

          {/* Order Items */}
          <h5 className="mb-2" style={{ marginLeft: "10%" }}>🛒 Items</h5>

          <Row className="g-3" style={{ marginLeft: "10%" }}>
            {selectedOrder.items.map((it) => {
              // Prefer **product image**, fallback to stored image
              const rawImage =
                it.productId?.images?.[0] || it.productImage || null;

              const imgSrc = makeImageUrl(rawImage);

              return (
                <Col md={6} lg={4} key={it._id}>
                  <Card className="border-0 rounded shadow-sm h-100">
                    <Card.Body>
                      <Card.Title className="text-center" style={{ fontSize: 16 }}>
                        {it.productName}
                      </Card.Title>

                      <Card.Text className="text-muted text-center mb-2">
                        {(() => {
                          const price = it.price ?? 0;
                          const priceStr = Number.isInteger(price)
                            ? `${price}`
                            : price.toFixed(2);

                          const packSize = it.packSize ?? it.selectedWeight ?? it.weight ?? null;
                          const packUnit = it.packUnit ?? it.selectedUnit ?? it.unit ?? null;

                          const fallbackQuantity = it.quantity ?? it.qty ?? 1;
                          const fallbackUnit = it.unit ?? "pcs";

                          const normalizeUnit = (u) => {
                            if (!u) return "";
                            const map = {
                              g: "gm",
                              kg: "kg",
                              ltr: "ltr",
                              ml: "ml",
                              pcs: "pcs",
                              packet: "packet",
                            };
                            return (map[u.toLowerCase()] || u).toString();
                          };

                          const packStr = packSize
                            ? `${packSize}${normalizeUnit(packUnit)}`
                            : `${fallbackQuantity} ${normalizeUnit(fallbackUnit)}`;

                          return (
                            <>
                              ₹{priceStr} | {packStr}
                            </>
                          );
                        })()}
                      </Card.Text>

                      {imgSrc ? (
                        <div className="text-center">
                          <img
                            src={imgSrc}
                            alt={it.productName}
                            style={{
                              maxWidth: "100%",
                              height: 120,
                              objectFit: "cover",
                              borderRadius: 8,
                            }}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/media/default.jpg";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="text-center text-muted" style={{ fontSize: 12 }}>
                          Image not available
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>

          <Button
            onClick={handleSaveChanges}
            variant="success"
            className="rounded-pill px-4 mt-3"
            style={{ marginLeft: "10%" }}
          >
            💾 Save Changes
          </Button>
        </>
      )}
    </Container>
  );
};

export default OrdersPage;
