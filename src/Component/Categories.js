import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Form, Table, Row, Col, Pagination } from "react-bootstrap";
import { FaSearch, FaFilter, FaTrash, FaEdit } from "react-icons/fa";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [editCategory, setEditCategory] = useState(null);
  const [showTable, setShowTable] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        "https://api.ravandurustores.com/api/categories"
      );
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateFormShow = () => {
    setShowTable(false);
    setEditCategory(null);
    setNewCategoryName("");
    setNewStatus("");
  };

  // 🔹 Helper: check duplicate category name (case + space insensitive)
  const isDuplicateCategory = (name, idToIgnore = null) => {
    const trimmed = (name || "").trim().toLowerCase();

    return categories.some((cat) => {
      if (idToIgnore && cat._id === idToIgnore) return false;
      const catName =
        (cat.name || cat.category || "").toString().trim().toLowerCase();
      return catName === trimmed;
    });
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName || !newStatus) {
      alert("Please provide both Category Name and Status.");
      return;
    }

    // ✅ Frontend duplicate protection
    if (isDuplicateCategory(newCategoryName)) {
      alert("This category already exists.");
      return;
    }

    try {
      const response = await axios.post(
        "https://api.ravandurustores.com/api/categories",
        {
          category: newCategoryName,
          status: newStatus,
        }
      );

      if (response.status === 201) {
        alert("Category created successfully!");
        setNewCategoryName("");
        setNewStatus("");
        fetchCategories();
        setShowTable(true);
      }
    } catch (error) {
      console.error("Error:", error.response?.data || error);

      const status = error.response?.status;
      const apiMsg = error.response?.data?.message;

      // 🎯 Better message for 400 duplicate
      const msg =
        apiMsg ||
        (status === 400
          ? "This category already exists."
          : "Failed to create category.");

      alert(msg);
    }
  };

  const handleEditCategory = (category) => {
    setEditCategory(category);
    setNewCategoryName(category.name);
    setNewStatus(category.status);
    setShowTable(false);
  };

  const handleUpdateCategory = async () => {
    if (!editCategory || !newCategoryName || !newStatus) {
      alert("All fields are required");
      return;
    }

    // ✅ Prevent renaming to another existing category name
    if (isDuplicateCategory(newCategoryName, editCategory._id)) {
      alert("Another category with this name already exists.");
      return;
    }

    try {
      const response = await fetch(
        `https://api.ravandurustores.com/api/categories/${editCategory._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: newCategoryName,
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update category");
      }

      const result = await response.json();
      alert("Category updated successfully");

      setCategories((prev) =>
        prev.map((cat) =>
          cat._id === editCategory._id ? result.category : cat
        )
      );
      setShowTable(true);
      setEditCategory(null);
      setNewCategoryName("");
      setNewStatus("");
    } catch (error) {
      console.error("Error updating category:", error);
      alert(error.message);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      const response = await fetch(
        `https://api.ravandurustores.com/api/categories/${categoryId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();
      if (result.success) {
        alert("Category deleted successfully!");
        setCategories((prev) => prev.filter((cat) => cat._id !== categoryId));
      } else {
        alert("Failed to delete category.");
      }
    } catch (error) {
      console.error("Error deleting category:", error.message);
      alert("An error occurred while deleting the category.");
    }
  };

  // 🔍 filter categories using searchTerm
  const filteredCategories = categories.filter((category) => {
    const name = (category.name || "").toLowerCase();
    const status = (category.status || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || status.includes(term);
  });

  // 📄 Pagination based on filteredCategories
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCategories = filteredCategories.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div style={{ maxWidth: "85%", marginLeft: "20%", marginTop: "1%" }}>
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}
      >
        {/* 🔍 Search box wired to state */}
        <div style={{ position: "relative", marginRight: "10px" }}>
          <input
            type="text"
            placeholder="Search by name or status"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "5px 10px 5px 30px", width: "220px" }}
          />
          <FaSearch
            style={{
              position: "absolute",
              left: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "14px",
            }}
          />
        </div>

        <FaFilter style={{ marginRight: "10px" }} />

        <button
          onClick={handleCreateFormShow}
          style={{ marginLeft: "auto", padding: "6px 12px", cursor: "pointer" }}
        >
          Create New Category
        </button>
      </div>

      {showTable ? (
        <>
          <Table striped bordered hover style={{ textAlign: "center" }}>
            <thead>
              <tr>
                <th>SL No</th>
                <th>Category Name</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentCategories.map((category, index) => (
                <tr key={category._id}>
                  <td>{indexOfFirstItem + index + 1}</td>
                  <td>{category.name}</td>
                  <td>{category.status || "Active"}</td>
                  <td>
                    {category.createdAt
                      ? new Date(category.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <FaEdit
                        onClick={() => handleEditCategory(category)}
                        style={{ cursor: "pointer" }}
                      />
                      <FaTrash
                        style={{ cursor: "pointer", color: "red" }}
                        onClick={() => handleDeleteCategory(category._id)}
                        aria-label="Delete category"
                      />
                    </div>
                  </td>
                </tr>
              ))}

              {currentCategories.length === 0 && (
                <tr>
                  <td colSpan={5}>No categories found.</td>
                </tr>
              )}
            </tbody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="justify-content-center">
              <Pagination.First
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              />
              <Pagination.Prev
                onClick={() => setCurrentPage((p) => p - 1)}
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
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
              />
              <Pagination.Last
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          )}
        </>
      ) : (
        <div className="category-form" style={{ marginBottom: "20px" }}>
          <div
            style={{
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
              padding: "20px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                if (editCategory) {
                  handleUpdateCategory();
                } else {
                  handleCreateCategory();
                }
              }}
            >
              <Row style={{ marginBottom: "15px" }}>
                <Col md={6}>
                  <Form.Group controlId="categoryName">
                    <Form.Label>Category Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={newCategoryName || ""}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name"
                      style={{ padding: "10px", marginBottom: "15px" }}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId="status">
                    <Form.Label>Status</Form.Label>
                    <Form.Control
                      as="select"
                      value={newStatus || ""}
                      onChange={(e) => setNewStatus(e.target.value)}
                      style={{ padding: "10px", marginBottom: "15px" }}
                    >
                      <option value="">Choose</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
              </Row>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Button
                  variant="secondary"
                  onClick={() => {
                    setNewCategoryName("");
                    setNewStatus("");
                    setEditCategory(null);
                    setShowTable(true);
                  }}
                  style={{ padding: "10px 20px" }}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  style={{ padding: "10px 20px" }}
                >
                  {editCategory ? "Update Category" : "Create Category"}
                </Button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Categories;
