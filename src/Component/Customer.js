import React, { useState, useEffect } from "react";
import { Pagination, Spinner } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";

function Customer() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const itemsPerPage = 5;

  // Fetch customers from API and sort newest -> oldest
  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "https://api.ravandurustores.com/api/customers/all"
      );
      if (!response.ok) throw new Error("Failed to fetch customers");

      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid data format");

      // sort by createdAt descending (newest first)
      const sorted = data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setCustomers(sorted);
      setCurrentPage(1); // reset page after fetch
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError(err.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter customers by search term (firstname, lastname, email)
  const filteredCustomers = customers.filter((customer) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    const first = (customer.firstname || "").toLowerCase();
    const last = (customer.lastname || "").toLowerCase();
    const email = (customer.email || "").toLowerCase();
    return first.includes(q) || last.includes(q) || email.includes(q);
  });

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);

  // reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Delete Customer
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;

    try {
      const response = await fetch(
        `https://api.ravandurustores.com/api/customers/delete/${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to delete customer");
      }

      // Remove from local state
      setCustomers((prev) => prev.filter((c) => c._id !== id));
      // If deletion made current page empty, step back a page if possible
      const newFiltered = filteredCustomers.filter((c) => c._id !== id);
      const newTotalPages = Math.max(1, Math.ceil(newFiltered.length / itemsPerPage));
      if (currentPage > newTotalPages) setCurrentPage(newTotalPages);
    } catch (err) {
      console.error("Error deleting customer:", err);
      alert("Failed to delete customer. See console for details.");
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: "1%", marginLeft: "20%" }}>
      <div>
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search"
          style={{ padding: "7px 10px", width: "320px", marginBottom: "14px" }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Error */}
        {error && <div className="alert alert-danger">{error}</div>}

        {/* Customers Table */}
        <table className="table table-bordered" style={{ width: "90%" }}>
          <thead style={{ textAlign: "center" }}>
            <tr>
              <th>Sl No</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th style={{ width: 80 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentCustomers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  No customers found.
                </td>
              </tr>
            ) : (
              currentCustomers.map((customer, index) => (
                <tr key={customer._id}>
                  <td>{indexOfFirstItem + index + 1}</td>
                  <td>{customer.firstname || "-"}</td>
                  <td>{customer.lastname || "-"}</td>
                  <td>{customer.email || "-"}</td>
                  <td className="text-center">
                    <FaTrash
                      onClick={() => handleDelete(customer._id)}
                      style={{ cursor: "pointer", color: "red" }}
                      title="Delete customer"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {filteredCustomers.length > 0 && (
          <Pagination className="justify-content-center">
            <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
            <Pagination.Prev onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} />

            {Array.from({ length: totalPages }, (_, i) => (
              <Pagination.Item
                key={i + 1}
                active={i + 1 === currentPage}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Pagination.Item>
            ))}

            <Pagination.Next onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
            <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
          </Pagination>
        )}
      </div>
    </div>
  );
}

export default Customer;
